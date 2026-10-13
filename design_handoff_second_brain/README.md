# Handoff: Second Brain SUPIMPA

## Overview
Protótipo navegável de um "second brain" pessoal (estilo Obsidian) para a agência Supimpa: cofre de notas em Markdown com wikilinks/backlinks, grafo de conhecimento, sistema de tarefas/projetos (Kanban), conexão via MCP com CLIs de IA (Claude Code, Claude Desktop, Codex, opencode, Cursor), sincronização multi-dispositivo (desktop + Android) e tela de ajustes.

## About the Design Files
Os arquivos deste pacote (`Second Brain SUPIMPA.dc.html` + `support.js`) são **referências de design em HTML** — protótipos que mostram aparência e comportamento pretendidos, não código de produção para copiar diretamente. A tarefa é **recriar este design no ambiente de código real** (app desktop nativo/Electron/Tauri, app mobile, backend de sync, servidor MCP) usando os padrões já estabelecidos no projeto de destino — ou, se não houver stack definida, escolher a mais adequada (ex.: Electron/Tauri + React para desktop, React Native/Flutter para mobile, Node/Rust para o servidor MCP).

## Fidelity
**Alta-fidelidade (hifi)** na camada visual: cores, tipografia, espaçamento e microinterações do protótipo devem ser recriados com precisão. As áreas de dados (sync real, servidor MCP real, criptografia) são **simuladas no protótipo** e precisam de implementação real de backend — o protótipo só define a UI/UX esperada dessas features.

## Screens / Views

Todas as telas vivem em uma janela de "desktop" (1060×770, chrome de macOS simulado) + uma tela de "celular Android" (300×624) lado a lado. Navegação por uma rail vertical de ícones à esquerda do desktop.

### 1. Notas (editor)
- **Propósito**: escrever/ler notas em Markdown, vinculando notas entre si.
- **Layout**: 3 colunas dentro da janela — rail de ícones (64px) → lista do cofre (246px, scroll) → área principal (flex, min 0).
- **Lista do cofre**: busca (placeholder "Buscar no cofre…", atalho ⌘K visual), seções INBOX / PROJETOS / SISTEMA / DIÁRIO, cada item com barra de destaque de 3px à esquerda quando ativo. Botão "+ Nova nota" fixo no rodapé.
- **Modo Editar**: input de título (Sora 800, 24px) → barra de formatação → split view (fonte Markdown em monospace à esquerda / prévia renderizada ao vivo à direita).
  - **Barra de formatação**: Negrito (`**texto**`), Itálico (`*texto*`), Código inline (`` `texto` ``), H2 (`## `), H3 (`### `), Lista (`- `), Citação (`> `), Link externo (`[texto](https://)`), e botão destacado "Vincular nota" que abre um popover de busca.
  - Os botões de negrito/itálico/código envolvem a seleção atual do textarea; H2/H3/lista/citação aplicam prefixo na linha do cursor (comportamento de toggle: clicar de novo remove o prefixo).
  - **Popover "Vincular nota"**: campo de busca + lista de notas do cofre filtradas por título; clicar insere `[[Título da Nota]]` no ponto do cursor; se a busca não corresponde a nenhuma nota existente, mostra opção "Criar e vincular ‘X’".
  - **Prévia ao vivo**: parser Markdown próprio (ver seção Interações) — títulos H2/H3, negrito, itálico, código inline, blocos de código com fence ```, listas, citações (`>`), links externos e wikilinks `[[Nota]]` (renderizados como chip clicável com ícone ↗, cor de destaque).
- **Modo Ler**: título grande (Sora 800, 30px) + chips de pasta/tags + selo opcional "Lido pelo MCP · <cliente> · <quando>" + corpo renderizado (mesmo parser) + painel lateral "Conexões" (252px): Links nesta nota / Notas que apontam pra cá (backlinks) / card "Acesso via MCP" / estado vazio "Sem conexões ainda".
- **Alternância Editar/Ler**: toggle de 2 botões no canto superior direito do breadcrumb.

### 2. Tarefas & Projetos
- **Propósito**: gestão de tarefas do dia a dia com visão Kanban e por projeto.
- **Header**: título + toggle "Quadro" / "Projetos" + botão "+ Nova tarefa".
- **Resumo (4 chips)**: Atrasadas (vermelho), Para hoje (laranja), Esta semana (amarelo), Entregues (verde) — contagens automáticas a partir das tarefas.
- **Quadro (Kanban)**: 4 colunas — A fazer / Fazendo / Revisão / Entregue (242px cada, scroll independente). Cada card: dot de cor do projeto + nome do projeto (uppercase, 10.5px) + checkbox circular de conclusão + título da tarefa + chip de prazo colorido por urgência (overdue/today/soon/normal/done) + progresso de subtarefas ("2/4") + botão seta "avançar coluna".
- **Projetos**: lista de cards (max-width 720px) — ícone do projeto, nome, cliente/contexto, chip de prazo, barra de progresso (%), e contagem "a fazer / em andamento / entregues".

### 3. Grafo do conhecimento
- **Propósito**: visualizar conexões entre notas.
- **Layout**: nó central "Sistema" (76px, gradiente azul) com 6 nós satélite conectados por linhas SVG, cada nó clicável abre a nota correspondente em modo Ler. Legenda de cores por categoria (Sistema/Projetos/Diário) no header.

### 4. Conexões MCP
- **Propósito**: gerenciar quais CLIs/agentes de IA têm acesso de leitura/escrita ao cofre.
- **Layout**: card escuro com endpoint (`mcp://second-brain.supimpa.local`) + status "online" + botão copiar; diagrama de fluxo CLI → Servidor MCP → Cofre; grid 2 colunas de cards por cliente (Claude Code, Claude Desktop, Codex, opencode, Cursor) com toggle on/off, descrição e badges de escopo (ler cofre / escrever / buscar).

### 5. Ajustes & Sincronização
- **Propósito**: dispositivos conectados, localização do cofre, opções de sync.
- **Layout**: lista de dispositivos (MacBook, Android, iPad) com status "sincronizado"; card do cofre (caminho, contagem de notas, tamanho); lista de toggles (criptografia ponta a ponta, sync automático, provedor de nuvem).

### 6. Celular (Android) — Nova nota
- **Propósito**: captura rápida no celular, sincronizando com a Inbox do desktop.
- **Layout**: bezel Android (punch-hole, status bar, top app bar Material com voltar/título/badge de sync/menu), campo de título, chips Inbox/tag, textarea de corpo, snackbar escuro de confirmação, bottom app bar (mic/foto/anexo + FAB laranja de check) e barra de navegação de 3 botões.

## Interactions & Behavior
- **Navegação por rail**: clique troca a view ativa (`notas`, `tarefas`, `grafo`, `mcp`, `ajustes`) sem reload — estado local do componente.
- **Seleção de nota**: clicar em item da lista, em wikilink, em nó do grafo ou em link/backlink do painel de Conexões abre a nota em modo Ler.
- **Parser Markdown → React** (ver lógica no `.dc.html`): processa por linha para blocos (fence ``` , `##`/`###`, `>`, `- `/`*` , parágrafo) e depois por regex inline para negrito/itálico/código/`[[wikilink]]`/`[texto](url)`. Wikilinks sem nota correspondente aparecem com opacidade reduzida e sem cursor de clique.
- **Toolbar de formatação**: manipula `selectionStart`/`selectionEnd` do textarea; negrito/itálico/código envolvem a seleção; H2/H3/lista/citação fazem replace da linha atual (toggle liga/desliga o prefixo); depois de aplicar, o foco e a seleção retornam ao textarea.
- **Vincular nota**: guarda a seleção do cursor antes de abrir o popover; ao escolher um resultado, insere `[[Título]]` exatamente na posição salva.
- **Kanban**: botão "avançar" move a tarefa para a próxima coluna na sequência todo → doing → review → done; ao chegar em done, o prazo é substituído por "Entregue" e o texto original é preservado para poder desfazer ao reabrir a tarefa (toggle do checkbox).
- **Captura no Android**: digitar no textarea + tocar no FAB de check salva a "nota" na Inbox do desktop (mesmo estado do app, sem página separada) e mostra snackbar por ~2.8s.
- **Toggles de conexão MCP**: clique alterna estado local on/off (visual apenas — sem chamada real).

## State Management
Estado relevante para recriar (hoje vive num único componente de front-end):
- `view` atual (notas/tarefas/grafo/mcp/ajustes) e `mode` do editor (edit/read) por nota.
- Lista de **notas** (id, título, pasta, tags, corpo Markdown, timestamp de atualização, campo opcional `readBy` para o selo MCP).
- Lista de **tarefas** (id, título, projeto, status de coluna, prazo + nível de urgência, subtarefas done/total).
- Dicionário de **projetos** (nome, cliente, cor, ícone, prazo).
- **Conexões MCP** (id do cliente → boolean conectado).
- Estado transitório do editor: seleção salva do textarea, query e abertura do popover de vínculo.
- **Dados reais a implementar**: persistência do cofre (arquivos Markdown em disco ou DB), índice de backlinks (derivado dos wikilinks, recalculado ao salvar), sync real entre dispositivos (websocket/CRDT ou similar), servidor MCP real expondo tools de leitura/escrita/busca sobre o cofre.

## Design Tokens
- **Cor primária (Azul Supimpa)**: `#0055a1` / fundo suave `#E1EEF9` / borda `#cae2f6`. Alternativas de tema no protótipo: Grafite `#334155` e Violeta `#6d4ad4` (com seus respectivos tons suaves).
- **Cor de destaque/CTA (Laranja Supimpa)**: `#f05127` / fundo suave `#fef4f0` / borda `#fde0d8`.
- **Neutros**: texto principal `#0f172a`, texto secundário `#334155`/`#475569`, texto terciário `#94a3b8`/`#64748b`, bordas `#e8edf3`/`#eef2f6`, fundos alternativos `#fcfcfd`/`#f8fafc`.
- **Estados de prazo**: atrasada `#dc2626` (bg `#fef2f2`), hoje `#ea580c` (bg `#fff7ed`), esta semana `#a16207` (bg `#fefce8`), normal `#64748b` (bg `#f1f5f9`), concluída `#16a34a` (bg `#f0fdf4`).
- **Tipografia**: Sora (600–800) para títulos/headings/marca; Inter (400–600) para corpo e UI; monospace (ui-monospace/SF Mono/Menlo) para código e fonte Markdown.
- **Radius**: 8–9px em botões/chips pequenos, 11–14px em cards, 16px na janela desktop, 40px no bezel do celular.
- **Sombras**: cards `0 1px 2px rgba(15,23,42,.04)`; janela desktop `0 34px 80px -34px rgba(15,23,42,.4)`; popover `0 24px 50px -18px rgba(15,23,42,.34)`.
- **Ícones**: Material Symbols Rounded (Google Fonts), peso 500, fill variável por contexto.

## Assets
Nenhuma imagem/foto externa — só ícones da fonte Material Symbols Rounded (via Google Fonts) e fontes Sora/Inter (via Google Fonts). Nenhum asset de marca de terceiros foi reproduzido; nomes de CLIs (Claude Code, Codex, opencode, Cursor) aparecem apenas como texto/rótulo.

## Screenshots
Pasta `screenshots/`, uma imagem por tela (capturadas direto do protótipo rodando):
- `01-notas.png` — editor de notas (modo Editar, split fonte/prévia).
- `02-tarefas-quadro.png` — Tarefas & Projetos, visão Quadro (Kanban).
- `03-tarefas-projetos.png` — Tarefas & Projetos, visão Projetos (progresso).
- `04-grafo.png` — Grafo do conhecimento.
- `05-mcp.png` — Conexões MCP.
- `06-ajustes.png` — Ajustes & Sincronização.
- `07-editor-toolbar-e-vinculo.png` — editor com o popover "Vincular nota" aberto.
- `08-android-nova-nota.png` — tela de nova nota no celular Android.

## Files
- `Second Brain SUPIMPA.dc.html` — protótipo completo (todas as telas descritas acima).
- `support.js` — runtime necessário para abrir o `.dc.html` (não faz parte do design, apenas infraestrutura de preview).
- `CODE-REFERENCE.md` — **template HTML completo + toda a lógica JS** do protótipo, comentado e organizado por seção, para o Claude Code usar como fonte de verdade além das descrições acima. Contém: estrutura de dados (notas, tarefas, projetos, conexões MCP), o parser Markdown → React linha por linha, a lógica da toolbar de formatação (envolver seleção / prefixo de linha), o fluxo do popover de vínculo de notas, e o cálculo de todas as views (Kanban, progresso de projetos, resumo de prazos).
- `screenshots/` — capturas de tela de cada view (ver lista acima).
