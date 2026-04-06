# o-mcp

MCP server for Ō — exposes your developer identity context to AI agents.

## Tools

### `get_developer_context`
Returns everything Ō knows about you — preferences, constraints, facts, project context — ordered by importance. Call at the start of a session so your agent knows who you are.

### `get_active_project`
Returns the currently active project (updated in the last 24h), its open tasks, and associated files. Returns empty if nothing is active.

### `add_memory`
Saves something important about you for future sessions. Parameters:
- `content` (string, required) — what to remember
- `category` (string) — `project`, `preference`, `fact`, `constraint`, or `other`
- `importance` (number, 1-10) — how critical this is

## Connecting to Claude Code

**Automatic:** Click "Connect to Claude Code" inside the Ō interface.

**Manual:** Add this to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "o-mcp": {
      "command": "npx",
      "args": ["o-mcp"]
    }
  }
}
```

## Connecting to Cursor / Windsurf

Use the HTTP/SSE mode:

```bash
npx o-mcp --http
```

Then point your MCP client to `http://127.0.0.1:3132/sse`.

## Security

- **Localhost only** — the server binds to `127.0.0.1`, never `0.0.0.0`
- **Auth token** — set `MCP_AUTH_TOKEN` in your `.env` to require authentication
- **Your data stays local** — the MCP server reads from your local SQLite database only

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `O_DB_PATH` | `./data/o.db` | Path to the Ō SQLite database |
| `MCP_AUTH_TOKEN` | (none) | Bearer token for auth (recommended) |
| `MCP_PORT` | `3132` | Port for HTTP/SSE mode |
