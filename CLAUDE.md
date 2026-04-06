# Ō — Contexto para o Claude Code

## O que é este projeto

Ō é um dashboard para power users do Claude Code. Mostra numa interface visual tudo que está escondido em JSONs e arquivos markdown: memórias, CLAUDE.md, plugins, MCP servers, marketplaces.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js + Fastify |
| Banco | SQLite via better-sqlite3 (só para chat history) |
| MCP server | @modelcontextprotocol/sdk |
| AI (chat) | Anthropic SDK direto |
| Estrutura | Monorepo: apps/web, apps/server, packages/mcp |
| Licença | MIT |

---

## Estrutura do repositório

```
o/
├── apps/
│   ├── web/          # Dashboard React (single page, sem routing)
│   └── server/       # Fastify API — lê configs do Claude Code
├── packages/
│   └── mcp/          # MCP server standalone
├── scripts/          # Setup e auto-start Windows
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## O que o servidor faz

O servidor NÃO armazena dados de identidade — ele **lê** os arquivos que o Claude Code já usa:

- `~/.claude/CLAUDE.md` — instruções globais
- `~/.claude/projects/*/memory/` — memórias automáticas
- `~/.claude/settings.json` — plugins e marketplaces
- `~/.claude.json` — MCP servers

O único dado próprio é o histórico de conversas do chat lateral (SQLite).

---

## Rotas da API

| Rota | O que faz |
|---|---|
| `GET /api/health` | Health check |
| `POST /api/chat` | Chat SSE streaming com Anthropic |
| `GET /api/claude-md` | Lista todos os CLAUDE.md encontrados |
| `PUT /api/claude-md` | Edita um CLAUDE.md |
| `GET /api/claude-memory` | Lista memórias do Claude Code por projeto |
| `GET /api/plugins` | Lista plugins do settings.json |
| `PUT /api/plugins/:id` | Ativa/desativa plugin |
| `GET /api/mcp-servers` | Lista MCP servers do .claude.json |
| `GET /api/marketplaces` | Lista marketplaces |
| `GET /api/overview` | Stats gerais |
| `GET /api/mcp/status` | Verifica se o-mcp está conectado |
| `POST /api/mcp/connect-claude-code` | Injeta o-mcp no .claude.json |

---

## Decisões técnicas

**Por que ler arquivos do Claude Code em vez de ter banco próprio?**
Porque os dados já existem. Duplicar seria criar dois sistemas de memória que divergem.

**Por que Fastify?**
SSE nativo, TypeScript first-class, performance.

**Por que SQLite ainda existe?**
Só para o histórico de conversas do chat lateral. As memórias e instruções vêm do filesystem.

**Por que não tem routing no frontend?**
É uma single page — dashboard único com chat lateral. Sem necessidade de rotas.

---

## Checklist de segurança

- [x] Nenhum dado pessoal hardcoded no código
- [x] .env, data/, MEMORY.md no .gitignore
- [x] MCP server com auth token e bind em 127.0.0.1
- [x] Repo criado do zero — histórico limpo
