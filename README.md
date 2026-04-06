# Ō

**Você sabe o que o Claude Code sabe sobre você?**

Ō é um dashboard local que mostra tudo que está escondido na configuração do Claude Code: memórias automáticas, instruções (CLAUDE.md), plugins, MCP servers, marketplaces. Tudo num lugar só, com interface visual.

O chat lateral lê seus dados reais e pode editar seu CLAUDE.md direto pela conversa.

---

## O que você vê

| Escondido em... | O Ō mostra |
|---|---|
| `~/.claude/projects/*/memory/` | Memórias por projeto, com tipo e conteúdo |
| `~/.claude/CLAUDE.md` + projetos | Todas as instruções, por seção, editáveis |
| `~/.claude/settings.json` | Plugins com toggle on/off |
| `~/.claude.json` | MCP servers conectados |
| `settings.json` | Marketplaces configurados |

---

## Instalação

```bash
git clone https://github.com/maiconciscobr/o.git
cd o
npm install
npx tsx scripts/setup.ts
```

Adicione sua `ANTHROPIC_API_KEY` no `.env` gerado. Depois:

```bash
npm run dev -w apps/server
npm run dev -w apps/web
```

Abre `http://localhost:5173`.

---

## Conectar o MCP ao Claude Code

Pelo terminal:

```bash
claude mcp add o-mcp --transport stdio --scope user -- npx tsx caminho/para/packages/mcp/src/index.ts
```

Ou pelo botão "Conectar ao Claude Code" no header do dashboard.

---

## Auto-start no Windows

Execute `scripts/install.bat` como administrador. O servidor roda invisível no login.

Para remover: `scripts/uninstall.bat`.

---

## Stack

| | |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Fastify, SQLite (better-sqlite3) |
| MCP | @modelcontextprotocol/sdk |
| Chat | Anthropic SDK |
| Estrutura | Monorepo (npm workspaces) |

---

## Estrutura

```
apps/web/          → Dashboard React (single page)
apps/server/       → API Fastify (lê configs do Claude Code)
packages/mcp/      → MCP server standalone
scripts/           → Setup e auto-start
```

---

## Contribuindo

Veja [CONTRIBUTING.md](./CONTRIBUTING.md).

## Licença

MIT
