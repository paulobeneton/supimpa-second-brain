import { describe, expect, it } from 'vitest'
import { change, emptyVault, reconcile, resolve, type Entity } from './sync'
const id = 'ce754a48-c798-4159-8948-a257677fa688'
const remote: Entity = { id, kind: 'note', version: 1, deleted: false, data: { title: 'Servidor' } }
describe('offline synchronization', () => {
  it('coalesces edits and preserves the original base revision', () => {
    const a = change({ ...emptyVault(), records: [remote] },'note',id,{ title: 'A' })
    const b = change(a,'note',id,{ title: 'B' })
    expect(b.pending).toHaveLength(1); expect(b.pending[0].base_version).toBe(1); expect(b.pending[0].data.title).toBe('B')
  })
  it('does not lose an edit made while a request was in flight', () => {
    const a = change(emptyVault(),'note',id,{ title: 'A' })
    const b = change(a,'note',id,{ title: 'B' })
    const result = reconcile(b,[{ operation_id: a.pending[0].operation_id, status: 'accepted', record: remote }],[remote])
    expect(result.records[0].data.title).toBe('B'); expect(result.pending[0].base_version).toBe(1)
  })
  it('acknowledges an accepted change once', () => {
    const a = change(emptyVault(),'note',id,{ title: 'A' })
    const results = [{ operation_id: a.pending[0].operation_id, status: 'accepted' as const, record: remote }]
    const b = reconcile(a,results,[remote]); expect(b.pending).toHaveLength(0); expect(reconcile(b,results,[remote])).toEqual(b)
  })
  it('preserves both versions on conflict and rebases only after explicit choice', () => {
    const a = change(emptyVault(),'note',id,{ title: 'Local' })
    const conflict = reconcile(a,[{ operation_id: a.pending[0].operation_id, status: 'conflict', record: remote }],[remote])
    expect(conflict.records[0].data.title).toBe('Local'); expect(conflict.conflicts[id]).toEqual(remote)
    const local = resolve(conflict,id,'local'); expect(local.pending[0].base_version).toBe(1); expect(local.conflicts).toEqual({})
    const server = resolve(conflict,id,'remote'); expect(server.pending).toHaveLength(0); expect(server.records[0]).toEqual(remote)
  })
  it('propagates deletions and restores without resurrecting remote tombstones', () => {
    const deleted = { ...remote, version: 2, deleted: true }
    const a = reconcile({ ...emptyVault(), records: [remote] },[],[deleted]); expect(a.records[0].deleted).toBe(true)
    const b = change(a,'note',id,remote.data,false); expect(b.pending[0].base_version).toBe(2)
  })
})
