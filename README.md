# Ō

> **TODO antes do launch:** gravar GIF de 8s mostrando — agente abre sessão → Ō injeta contexto via MCP → agente já sabe stack, restrições e projeto ativo sem nenhuma explicação. Colocar aqui no lugar desse bloco.

**Your AI agents forget you. Ō doesn't.**

Ō is an open source identity layer for developers. It remembers who you are — your stack, your constraints, your projects — and feeds that context to Claude Code, Cursor, or any MCP-compatible agent automatically, before the session even starts.

No more re-explaining. No more `CLAUDE.md` files you have to maintain by hand.

---

## The problem

Every session with an AI agent starts from zero.

You explain your stack. You explain that you use Bun, not Node. You explain the contractual constraint that rules out certain side projects. You explain which server the thing runs on. Then the session ends, and next time you explain it all again.

`CLAUDE.md` helps. But you write it, you maintain it, and it only covers one project at a time.

---

## How it works

**1. You talk to Ō once.**
Tell it about yourself — your stack, preferences, constraints, what you're working on. Or just start working and let KAIROS figure it out.

**2. KAIROS learns in the background.**
A lightweight daemon reads your sessions, extracts what matters, and keeps your context up to date. You never touch a config file again.

**3. Every agent session starts informed.**
Ō runs a local MCP server. Claude Code, Cursor, and Windsurf connect to it and receive your full context before the first message. One click to connect.

---

## Install

```bash
npx create-o-app
```

Opens in your browser. No config files, no YAML, no manual setup.

To connect Claude Code: click **"Connect to Claude Code"** inside Ō. Done.

> Requires Node.js 20+ and an Anthropic API key.

---

## What Ō knows about you

After your first conversation, you'll see a screen called **"What Ō knows about you"** — a live, editable list of everything the system has learned. You control what gets sent to agents. Edit, delete, or add anything at any time.

---

## Security

- **Everything stays local.** Memories live in a SQLite database on your machine. Nothing is sent anywhere except the Anthropic API.
- **MCP server is localhost-only by default.** No external process can reach your context.
- **Your API key never leaves your machine.** Ō calls Anthropic directly — no Ō cloud in the middle.
- **You own your data.** Export or wipe everything at any time.

---

## v0.1 — what's here now

- Chat interface with persistent memory
- KAIROS — background daemon that learns from your sessions automatically
- "What Ō knows about you" — editable memory panel
- MCP server — one-click connection to Claude Code, Cursor, Windsurf
- Project system — conversations, files, tasks, and notes grouped per project
- Self-hosted, MIT licensed, no accounts required

---

## Roadmap

**v0.2**
- Sync context across machines
- Multi-profile support
- Slash commands to query your own context mid-session

**v0.3**
- One-line install script
- Homebrew tap / Windows installer
- Context diff — see exactly what KAIROS changed and why

---

## Contributing

Ō is early. The best contribution right now is using it, breaking it, and opening issues.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for dev setup and what we're actively working on.

---

## License

MIT
