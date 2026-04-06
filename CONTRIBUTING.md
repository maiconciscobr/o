# Contributing to Ō

Thanks for your interest in contributing. Ō is early — bugs, ideas, and PRs are all welcome.

## Setup

```bash
# Clone
git clone https://github.com/YOUR_ORG/o.git
cd o

# Install dependencies
npm install

# Create your .env
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Run all three services in parallel
npm run dev
```

This starts:
- **Web** on `http://localhost:5173` (Vite)
- **Server** on `http://localhost:3131` (Fastify)
- **MCP** on `http://localhost:3132` (when using `--http` flag)

## Monorepo structure

```
o/
├── apps/web/         # React + Vite frontend
├── apps/server/      # Fastify + SQLite backend + KAIROS daemon
└── packages/mcp/     # Standalone MCP server (npx o-mcp)
```

Each package has its own `package.json` and `tsconfig.json`. The root uses npm workspaces.

## Running individual packages

```bash
# Only the server
npm run dev -w apps/server

# Only the frontend
npm run dev -w apps/web

# Only the MCP server (HTTP mode)
npm run dev -w packages/mcp
```

## Commit conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add memory search
fix: SSE stream not closing on abort
docs: update MCP connection instructions
refactor: extract memory grouping logic
```

## Opening a PR

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Run `npm run build` to check for type errors
5. Commit with a conventional commit message
6. Open a PR against `main`

## What we're looking for

- Bug reports with reproduction steps
- UX improvements to the memory panel or chat
- New MCP tools (with clear use cases)
- Documentation improvements
- Performance improvements

## What to avoid

- Adding external databases (SQLite is intentional)
- Cloud features (Ō is local-first by design)
- Dependencies that require native compilation beyond better-sqlite3
