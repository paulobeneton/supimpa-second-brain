// Design tokens — transcritos fielmente do handoff (README §Design Tokens).
// `acc` é a cor de tema (padrão Azul Supimpa); `orange` é a cor de destaque/CTA fixa.

export type AccentName = 'Azul Supimpa' | 'Grafite' | 'Violeta'

export interface Accent {
  hex: string
  soft: string
  bd: string
}

/** Temas de acento (o protótipo permite trocar em Ajustes; padrão = Azul Supimpa). */
export const accents: Record<AccentName, Accent> = {
  'Azul Supimpa': { hex: '#0055a1', soft: '#E1EEF9', bd: '#cae2f6' },
  Grafite: { hex: '#334155', soft: '#eef2f6', bd: '#dbe2ea' },
  Violeta: { hex: '#6d4ad4', soft: '#f3effc', bd: '#e2d8f7' },
}

/** Laranja Supimpa — destaque / CTA (fixo, independente do tema). */
export const orange: Accent = { hex: '#f05127', soft: '#fef4f0', bd: '#fde0d8' }

/** Neutros. */
export const c = {
  text: '#0f172a', // texto principal
  text2: '#334155', // secundário
  text3: '#475569', // secundário 2
  muted: '#94a3b8', // terciário
  muted2: '#64748b', // terciário 2
  faint: '#cbd5e1', // ícones/placeholder fracos
  border: '#e8edf3',
  border2: '#eef2f6',
  border3: '#f1f5f9',
  bg: '#ffffff',
  bgAlt: '#fcfcfd',
  bgAlt2: '#f8fafc',
  active: '#eef2f7', // item de lista ativo
} as const

/** Estados de prazo (Kanban / projetos). */
export const dueColors = {
  overdue: { bg: '#fef2f2', color: '#dc2626', bd: '#fecaca', icon: 'error' },
  today: { bg: '#fff7ed', color: '#ea580c', bd: '#fed7aa', icon: 'today' },
  soon: { bg: '#fefce8', color: '#a16207', bd: '#fde68a', icon: 'schedule' },
  normal: { bg: '#f1f5f9', color: '#64748b', bd: '#e2e8f0', icon: 'schedule' },
  done: { bg: '#f0fdf4', color: '#16a34a', bd: '#bbf7d0', icon: 'check_circle' },
} as const

export const font = {
  sora: "'Sora', sans-serif",
  inter: "'Inter', sans-serif",
  mono: "ui-monospace, 'SF Mono', Menlo, monospace",
} as const

export const shadow = {
  card: '0 1px 2px rgba(15,23,42,.04)',
  window: '0 34px 80px -34px rgba(15,23,42,.4), 0 10px 28px -14px rgba(15,23,42,.18)',
  popover: '0 24px 50px -18px rgba(15,23,42,.34)',
} as const
