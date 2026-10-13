export type Kind = 'note' | 'task' | 'project'
export interface RecordData { [key: string]: unknown }
export interface Entity { id: string; kind: Kind; data: RecordData; version: number; deleted: boolean; updated_at?: string }
export interface Mutation { operation_id: string; id: string; kind: Kind; base_version: number; data: RecordData; deleted: boolean }
export interface SyncResult { operation_id: string; status: 'accepted' | 'conflict'; record: Entity }
export interface Vault { records: Entity[]; pending: Mutation[]; conflicts: Record<string, Entity> }
export const emptyVault = (): Vault => ({ records: [], pending: [], conflicts: {} })
export function change(vault: Vault, kind: Kind, id: string, data: RecordData, deleted = false): Vault {
  const old = vault.records.find(r => r.id === id)
  const queued = vault.pending.find(r => r.id === id)
  const record: Entity = { id, kind, data, deleted, version: old?.version ?? 0, updated_at: new Date().toISOString() }
  const mutation: Mutation = { operation_id: crypto.randomUUID(), id, kind, data, deleted, base_version: queued?.base_version ?? record.version }
  return { ...vault, records: [...vault.records.filter(r => r.id !== id), record], pending: [...vault.pending.filter(r => r.id !== id), mutation] }
}
/** Acknowledge only the revision that was sent, preserving edits made during the request. */
export function reconcile(vault: Vault, results: SyncResult[], remote: Entity[]): Vault {
  let pending = [...vault.pending]
  const conflicts = { ...vault.conflicts }
  const records = new Map(vault.records.map(r => [r.id, r]))
  for (const result of results) {
    const current = pending.find(p => p.id === result.record.id)
    if (!current) continue
    if (result.status === 'conflict') { conflicts[current.id] = result.record; continue }
    delete conflicts[current.id]
    if (current.operation_id === result.operation_id) pending = pending.filter(p => p.id !== current.id)
    else pending = pending.map(p => p.id === current.id ? { ...p, base_version: result.record.version } : p)
  }
  for (const record of remote) {
    const local = records.get(record.id)
    if (!pending.some(p => p.id === record.id)) records.set(record.id, record)
    else if (local) records.set(record.id, { ...local, version: record.version })
  }
  return { records: [...records.values()], pending, conflicts }
}
export function resolve(vault: Vault, id: string, choice: 'local' | 'remote'): Vault {
  const remote = vault.conflicts[id]
  if (!remote) return vault
  const conflicts = { ...vault.conflicts }; delete conflicts[id]
  if (choice === 'remote') return { conflicts, pending: vault.pending.filter(p => p.id !== id), records: vault.records.map(r => r.id === id ? remote : r) }
  return { ...vault, conflicts, pending: vault.pending.map(p => p.id === id ? { ...p, base_version: remote.version, operation_id: crypto.randomUUID() } : p) }
}
