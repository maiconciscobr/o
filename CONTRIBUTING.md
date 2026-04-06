# Contribuindo

## Setup

```bash
git clone https://github.com/maiconciscobr/o.git
cd o
npm install
cp .env.example .env
# Adicione sua ANTHROPIC_API_KEY no .env
```

## Rodando

```bash
# Server (porta 3131)
npm run dev -w apps/server

# Frontend (porta 5173)
npm run dev -w apps/web

# MCP server (porta 3132, modo HTTP)
npm run dev -w packages/mcp
```

## Estrutura

```
apps/web/          → React + Vite (dashboard)
apps/server/       → Fastify (lê configs do Claude Code)
packages/mcp/      → MCP server standalone
```

O servidor **não armazena** dados de identidade. Ele lê os arquivos que o Claude Code já usa (`~/.claude/`). O único dado próprio é o histórico de conversas do chat (SQLite em `data/`).

## Commits

Conventional Commits:

```
feat: nova feature
fix: correção de bug
refactor: mudança sem alterar comportamento
polish: melhoria visual/UX
docs: documentação
```

## PRs

1. Fork
2. Branch: `feat/sua-feature`
3. Commit
4. PR contra `main`

## O que queremos

- Melhorias de UX no dashboard
- Novos dados do Claude Code para exibir
- Performance
- Bug fixes

## O que não queremos

- Cloud features (Ō é local)
- Banco de dados externo (SQLite é intencional)
- Routing no frontend (é single page)
