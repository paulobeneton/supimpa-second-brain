# Second Brain SUPIMPA

App de notas em Markdown com wikilinks/backlinks, grafo de conhecimento, gestão de
tarefas/projetos (Kanban), conexão MCP com CLIs de IA e sincronização desktop + mobile.

Referência de design em [`design_handoff_second_brain/`](design_handoff_second_brain/)
(README, CODE-REFERENCE.md e screenshots). O código de produção recria esse design.

## Arquitetura

| Camada | Stack | Estado |
|---|---|---|
| **Frontend** | React + TypeScript + Vite, **PWA** offline-first | 🟡 em andamento (tela de Notas pronta) |
| **Backend** | Laravel + **MySQL/MariaDB**, API JSON, auth Sanctum | ⏳ pendente (precisa de PHP/Composer/MySQL) |
| **Sync** | offline-first estilo Google Keep: IndexedDB + fila → Laravel | ⏳ pendente |
| **MCP** | `laravel/mcp` sobre os models Eloquent — stdio + Streamable HTTP | ⏳ pendente |

- **Multi-user** (equipe): toda tabela terá `owner_id` + permissões.
- **Persistência**: notas no MySQL (corpo Markdown como TEXT + metadados em colunas);
  wikilinks numa tabela `note_links` → backlinks e grafo derivam daí.

## `frontend/` — como rodar

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Fontes (Sora, Inter, Material Symbols) são **auto-hospedadas** via npm — sem CDN, pronto
para offline.

### Estrutura
```
frontend/src/
├─ design/     tokens.ts (cores/tipografia do handoff), Icon.tsx, fonts.css
├─ data/       types.ts, seed.ts (notas iniciais do handoff)
├─ store/      useStore.ts (Zustand — trocável por IndexedDB+sync sem mudar a API)
├─ lib/        markdown.tsx (parser Markdown→React + wikilinks/backlinks)
├─ components/ Shell.tsx (janela, rail, lista do cofre)
├─ views/      NotesView.tsx (editor, toolbar, split, popover, modo Ler, conexões)
└─ App.tsx     roteia as views (só Notas implementada por ora)
```

### Verificação visual
`shoot.mjs` / `shoot2.mjs` (puppeteer-core) capturam screenshots esperando
`document.fonts.ready` — necessário porque o font de ícones usa `font-display: block`.

## Roadmap
1. ✅ Tela de **Notas** (editor Markdown + toolbar + vínculo + backlinks + modo Ler).
2. ⏳ Backend Laravel + MySQL (após instalar PHP — recomendado **Laragon**).
3. ⏳ Servidor MCP (`laravel/mcp`).
4. ⏳ Motor de sync offline-first + PWA (service worker, IndexedDB, fila).
5. ⏳ Telas Tarefas/Kanban, Grafo, MCP, Ajustes, e captura no celular (Android).
