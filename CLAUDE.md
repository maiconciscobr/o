# Ō — Contexto para o Claude Code

## O que é este projeto

Ō é uma camada de identidade pessoal para desenvolvedores, exposta via MCP para qualquer agente de código (Claude Code, Cursor, Windsurf). É open source, self-hosted, MIT.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend | Node.js + Fastify (migrado de Bun + Hono) |
| Banco | SQLite via better-sqlite3 |
| MCP server | @modelcontextprotocol/sdk (Anthropic oficial) |
| AI | Anthropic SDK direto, sem abstração |
| Estilo | Tailwind + shadcn/ui |
| Estrutura | Monorepo: apps/web, apps/server, packages/mcp |
| Licença | MIT |

---

## Estrutura do repositório

```
o/
├── apps/
│   ├── web/          # React + Vite (interface do usuário)
│   └── server/       # Fastify + SQLite + KAIROS daemon
├── packages/
│   └── mcp/          # MCP server standalone (npx o-mcp)
├── .env.example      # só ANTHROPIC_API_KEY, AUTH_TOKEN, PORT
├── .gitignore        # ver seção de segurança abaixo
├── docker-compose.yml
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
└── LICENSE
```

---

## Fases de execução

Execute em ordem. Cada fase depende da anterior.

### Fase 1 — Setup do monorepo

1. Criar estrutura de pastas: `apps/web`, `apps/server`, `packages/mcp`
2. Criar `package.json` raiz com workspaces apontando para os três pacotes
3. Mover `src/ui` → `apps/web` (mantém estrutura interna)
4. Mover `src/server` + `src/core` + `src/features` + `src/integrations` → `apps/server`
5. Criar `packages/mcp` vazio (será preenchido na Fase 3)
6. Atualizar todos os imports relativos que quebraram com a mudança de pasta

### Fase 2 — Adaptar o servidor

**Manter:**
- Agent loop (`src/core/agent.ts`)
- SQLite + migrations (`src/core/db.ts`)
- Sistema de projetos completo (projects, tasks, notes, files)
- KAIROS completo (heartbeat + dream cycle + triggers)
- Sistema de memórias (`src/features/memory/`)
- Dev tools (file_read, file_write, bash_execute, file_search)
- Willow (`src/features/willow/`)
- Auth middleware
- SSE streaming

**Remover completamente:**
- `src/features/buddy/` (tamagotchi — feature pessoal)
- `src/features/multiagent/` (complexidade desnecessária para v0.1)
- `src/features/ultraplan/` (idem)
- `src/server/github-sync.ts` (infra específica removida)
- `src/integrations/whatsapp.ts`
- `src/integrations/airtable.ts`
- `src/integrations/sheets.ts`
- `src/integrations/email.ts`
- `src/integrations/tunnel.ts`
- `start.bat` (script Windows pessoal)

**Manter com modificação:**
- `src/integrations/http.ts` — manter, é genérico
- `src/integrations/devtools.ts` — manter
- `scripts/setup.ts` — reescrever: remover lógica de buddy, chromium, cloudflared. Manter: criar .env, rodar migrations, gerar AUTH_TOKEN

**Migrar Hono → Fastify:**
- Reescrever `src/server/api.ts` usando Fastify
- Manter todas as rotas existentes (mesmos paths, mesma lógica)
- SSE: usar `reply.raw` do Fastify para streams

**Remover features flags do .env:**
- Apagar todas as linhas `FEATURE_*` do `.env.example`
- O que fica no `.env.example`:
  ```
  ANTHROPIC_API_KEY=sk-ant-...
  AUTH_TOKEN=CHANGE_ME
  PORT=3131
  CLAUDE_MODEL=claude-sonnet-4-5
  ```

### Fase 3 — MCP server (packages/mcp)

Criar um MCP server standalone que expõe 3 tools:

**`get_developer_context`**
- Retorna: memórias do usuário (de `memories` table) ordenadas por importância + último acesso
- Formato de retorno: texto estruturado, não JSON cru
- Uso: agente chama no início da sessão para saber quem é o usuário

**`get_active_project`**
- Retorna: projeto ativo (se houver), suas tasks abertas (todo + doing), e lista de arquivos
- O "projeto ativo" é o último projeto atualizado nas últimas 24h
- Retorna vazio se nenhum projeto estiver ativo

**`add_memory`**
- Parâmetros: `content` (string), `category` (project | preference | fact | constraint | other), `importance` (1-10)
- Salva na tabela `memories` do SQLite
- Uso: agente pode capturar contexto importante durante a sessão

**Segurança do MCP:**
- Adicionar `MCP_AUTH_TOKEN` no `.env` (gerado pelo setup.ts)
- MCP server valida token em toda requisição
- Bindar apenas em `127.0.0.1` (nunca `0.0.0.0`)
- Documentar isso claramente no README de `packages/mcp`

**Exposição:**
- Como servidor HTTP na porta 3132 (para desenvolvimento)
- Como executável via `npx o-mcp` (para produção)
- `package.json` de `packages/mcp` com `bin: { "o-mcp": "./dist/index.js" }`

**Conexão automática com Claude Code:**
- Criar endpoint `POST /api/mcp/connect-claude-code` no servidor principal
- Esse endpoint: detecta se `~/.claude/settings.json` existe, injeta a config do MCP server, retorna status
- O frontend chama esse endpoint quando usuário clica "Conectar ao Claude Code"

### Fase 4 — Adaptar o frontend

**Remover:**
- `BuddyWidget.tsx`, `BuddySvg.tsx`, `BuddyPixel.tsx`
- `WillowCard.tsx`
- `KairosIndicator.tsx` (substituir por algo mais simples)
- Saudação hardcoded removida de `ChatWindow.tsx`

**Modificar:**
- `ProjectWizard.tsx`: remover opção "Criar repositório GitHub" (era infra específica)
- `HomeScreen` em `ChatWindow.tsx`: tornar saudação genérica ("Good morning" ou sem nome)
- `App.tsx`: remover referências a buddy, willow check na inicialização

**Adicionar — tela de memórias:**
- Nova rota/view: `/memories`
- Componente `MemoryPanel.tsx`:
  - Lista todas as memórias da tabela `memories`
  - Agrupadas por categoria (preference, fact, project, constraint, other)
  - Cada item: texto + importância (barra visual) + botão deletar
  - Botão "Adicionar memória" abre campo inline
  - Título da tela: **"What Ō knows about you"**
- Acessível pelo rail lateral (ícone de cérebro ou similar)

**Adicionar — painel de conexão MCP:**
- Componente `McpStatus.tsx` no header:
  - Ponto verde + "Connected" se MCP funcionando
  - Ponto cinza + botão "Connect to Claude Code" se não conectado
  - O botão chama `POST /api/mcp/connect-claude-code`
  - Mostra instruções manuais se detecção automática falhar

**Adicionar — onboarding:**
- Na primeira vez (detectar via flag no SQLite ou localStorage), mostrar tela de onboarding
- Ō verifica se existe `CLAUDE.md` em `~/` ou no diretório atual
- Se existe: importa como primeira memória, mostra o que capturou, pergunta se está correto
- Se não existe: mostra uma única pergunta: *"What did you have to explain to an AI agent this week that you've already explained before?"*
- Depois disso: vai direto para o chat. KAIROS assume o resto.

### Fase 5 — Arquivos OSS obrigatórios

**`.gitignore` — adicionar além do existente:**
```
MEMORY.md
DIARIO.md
*.lock
data/
.env
node_modules/
dist/
.superpowers/
```

**`CONTRIBUTING.md`** — incluir:
- Como fazer setup do ambiente de dev
- Estrutura do monorepo explicada
- Como rodar os três pacotes em paralelo
- Convenção de commits (conventional commits)
- Como abrir um PR

**`CODE_OF_CONDUCT.md`** — usar Contributor Covenant v2.1 padrão

**`docker-compose.yml`** — três serviços:
- `web`: apps/web buildado, porta 5173
- `server`: apps/server, porta 3131
- `mcp`: packages/mcp, porta 3132
- Volume compartilhado para o SQLite

**`GitHub Actions` — `.github/workflows/ci.yml`:**
- Trigger: push e PR para main
- Jobs: lint (ESLint), type-check (tsc --noEmit), build (todos os pacotes)
- Node 20

**`packages/mcp/README.md`** — documentação específica do MCP server:
- O que são as 3 tools
- Como conectar manualmente (para quem não usa Claude Code)
- Nota de segurança: localhost-only, token obrigatório

---

## Checklist de segurança — obrigatório antes do primeiro commit público

- [x] `start.bat` — nunca existiu (repo criado do zero)
- [x] Nenhum username pessoal no código
- [x] Nenhum path de servidor no código
- [x] Nenhum IP hardcoded no código
- [x] Nenhum nome pessoal no código
- [x] `MEMORY.md` no `.gitignore`
- [x] `.env` no `.gitignore`
- [x] `data/` no `.gitignore`
- [x] Nenhum arquivo em `data/` commitado
- [x] Repo criado do zero — histórico limpo
- [x] MCP server com auth token e bind em 127.0.0.1

---

## Decisões técnicas e o porquê

**Por que migrar de Bun para Node.js?**
Acessibilidade para contribuidores open source. Node.js tem ecossistema maior e menos fricção de setup. Se quiser reverter para Bun, é simples — a lógica não muda.

**Por que Fastify e não Express?**
Performance nativa com SSE, suporte a TypeScript de primeira classe, ecossistema moderno. Express é legacy.

**Por que manter SQLite e não Postgres?**
Zero dependência externa. Usuário instala com um comando, sem Docker obrigatório, sem serviço de banco separado. SQLite aguenta o uso de um desenvolvedor solo sem problema.

**Por que o MCP server é um pacote separado (`packages/mcp`)?**
Usuário pode instalar só o MCP server (`npx o-mcp`) sem precisar do servidor completo. Também facilita contribuições isoladas.

**Por que remover multiagent e UltraPlan?**
Complexidade que não serve o caso de uso central do Ō. Se a comunidade quiser de volta, é uma contribuição bem delimitada.

---

## O que o Ō NÃO é

- Não é IDE — não compete com Cursor ou Windsurf
- Não é memória de código — não armazena arquivos, diffs ou decisões de arquitetura
- Não é chatbot genérico — foco exclusivo em identidade do desenvolvedor
- Não tem cloud — tudo local, sempre

---

## GIF pendente

**TODO — cobrar antes do launch público:**
Gravar GIF de 8 segundos mostrando:
1. Agente (Claude Code) abre nova sessão
2. Ō injeta contexto via MCP automaticamente
3. Agente já sabe stack, restrições e projeto ativo — sem nenhuma explicação do usuário

Esse GIF vai no topo do README e é o principal argumento de venda visual do projeto.
