export type Folder = 'Inbox' | 'Projetos' | 'Sistema' | 'Diário'

export interface Note {
  id: string
  title: string
  folder: Folder
  tags: string[]
  /** Rótulo humano de "última atualização" (ex.: "há 5 min"). Vira timestamp real no backend. */
  updated: string
  /** Selo "Lido pelo MCP · <cliente> · <quando>". Vazio = sem leitura por MCP. */
  readBy: string
  /** Corpo em Markdown. */
  md: string
}

/** Captura rápida vinda do celular (Android) — pousa na Inbox do desktop. */
export interface Capture {
  id: string
  text: string
  when: string
}

export type View = 'notas' | 'tarefas' | 'grafo' | 'mcp' | 'ajustes'
export type EditorMode = 'edit' | 'read'
