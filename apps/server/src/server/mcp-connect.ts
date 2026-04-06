import type { FastifyInstance } from "fastify";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// Claude Code stores MCP servers in ~/.claude.json (not ~/.claude/settings.json)
function getClaudeJsonPath(): string {
  return path.join(os.homedir(), ".claude.json");
}

export function registerMcpConnectRoute(app: FastifyInstance): void {
  app.post("/api/mcp/connect-claude-code", async (request) => {
    const claudeJsonPath = getClaudeJsonPath();

    try {
      let config: Record<string, any> = {};

      if (fs.existsSync(claudeJsonPath)) {
        const content = fs.readFileSync(claudeJsonPath, "utf-8");
        config = JSON.parse(content);
      }

      if (!config.mcpServers) {
        config.mcpServers = {};
      }

      const mcpToken = process.env.MCP_AUTH_TOKEN || "";
      const dbPath = path.resolve(process.cwd(), "data", "o.db");

      config.mcpServers["o-mcp"] = {
        type: "stdio",
        command: "npx",
        args: ["tsx", path.resolve(process.cwd(), "packages/mcp/src/index.ts")],
        env: {
          O_DB_PATH: dbPath,
          ...(mcpToken ? { MCP_AUTH_TOKEN: mcpToken } : {}),
        },
      };

      fs.writeFileSync(claudeJsonPath, JSON.stringify(config, null, 2), "utf-8");

      return {
        ok: true,
        message: "Ō MCP server conectado ao Claude Code",
        path: claudeJsonPath,
      };
    } catch (err: any) {
      return {
        ok: false,
        error: err.message,
        manual: {
          instruction:
            "Adicione isso no ~/.claude.json dentro de mcpServers:",
          config: {
            "o-mcp": {
              type: "stdio",
              command: "npx",
              args: ["tsx", "caminho/para/packages/mcp/src/index.ts"],
            },
          },
        },
      };
    }
  });

  app.get("/api/mcp/status", async () => {
    const claudeJsonPath = getClaudeJsonPath();

    try {
      if (!fs.existsSync(claudeJsonPath)) {
        return { connected: false, reason: "~/.claude.json não encontrado" };
      }

      const content = fs.readFileSync(claudeJsonPath, "utf-8");
      const config = JSON.parse(content);

      const isConnected = !!config.mcpServers?.["o-mcp"];
      return { connected: isConnected };
    } catch {
      return { connected: false, reason: "Não foi possível ler ~/.claude.json" };
    }
  });
}
