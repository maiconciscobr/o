# Ō

**Você sabe o que o Claude Code sabe sobre você?**

Ō é um dashboard local que mostra tudo que está escondido na configuração do Claude Code: memórias automáticas, instruções (CLAUDE.md), plugins, MCP servers e marketplaces. Tudo num lugar só, com interface visual.

O chat lateral lê seus dados reais e pode editar seu CLAUDE.md direto pela conversa.

---

## Instalação

```bash
git clone https://github.com/maiconciscobr/o.git
cd o
npm install
npm run setup
npm run dev
```

O setup é interativo — pede sua API key e conecta o MCP ao Claude Code automaticamente.

Abre `http://localhost:5173`.

> **Windows:** se `npm install` falhar com erro de `node-gyp`, instale o Visual Studio Build Tools:
> ```
> winget install Microsoft.VisualStudio.2022.BuildTools
> ```
> Depois rode `npm install` de novo.

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

## Auto-start (Windows)

Para o Ō rodar automaticamente quando ligar o PC:

```
scripts\install.bat
```

Para remover: `scripts\uninstall.bat`

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

## Contribuindo

Veja [CONTRIBUTING.md](./CONTRIBUTING.md).

## Licença

MIT
