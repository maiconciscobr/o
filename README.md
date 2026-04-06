# Ō

**Dashboard para power users do Claude Code.**

Tudo que você configura na mão em JSONs e arquivos markdown, agora tem interface visual.

---

## O que o Ō mostra

| O que está escondido | Onde fica | O que o Ō faz |
|---|---|---|
| Memórias automáticas | `~/.claude/projects/*/memory/` | Mostra por projeto, expande em side sheet |
| Instruções para agentes | `~/.claude/CLAUDE.md` + projetos | Visualiza por seções, edita inline |
| Plugins instalados | `~/.claude/settings.json` | Lista com toggle on/off em tempo real |
| MCP servers | `~/.claude.json` | Lista com status de conexão |
| Marketplaces | `~/.claude/settings.json` | Lista fontes configuradas |

Além disso, o **chat lateral** é um assistente de curadoria de identidade. Ele lê seus dados reais e pode **editar seu CLAUDE.md** direto pela conversa.

---

## Requisitos

- Node.js 20+
- Anthropic API key (para o chat lateral)

---

## Instalação

```bash
git clone https://github.com/maiconciscobr/o.git
cd o
npm install
npx tsx scripts/setup.ts
```

Adicione sua `ANTHROPIC_API_KEY` no arquivo `.env` gerado.

```bash
npm run dev
```

Abre `http://localhost:5173`.

---

## Conectar ao Claude Code

Clique em **"Conectar ao Claude Code"** no header, ou rode manualmente:

```bash
claude mcp add o-mcp --transport stdio --scope user -- npx tsx /caminho/para/o/packages/mcp/src/index.ts
```

---

## Auto-start no Windows

```bash
# Executar como administrador
scripts/install.bat
```

O servidor roda invisível (sem janela) toda vez que você liga o PC.

---

## Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Fastify + SQLite (better-sqlite3)
- **MCP:** @modelcontextprotocol/sdk
- **AI (chat):** Anthropic SDK
- **Estrutura:** Monorepo com npm workspaces

---

## Estrutura

```
o/
├── apps/web/          # Dashboard React
├── apps/server/       # API Fastify
├── packages/mcp/      # MCP server standalone
└── scripts/           # Setup e auto-start
```

---

## Contribuindo

Veja [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## Licença

MIT
