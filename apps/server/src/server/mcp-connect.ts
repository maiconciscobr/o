import type { FastifyInstance } from "fastify";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export function registerMcpConnectRoute(app: FastifyInstance): void {
  app.post("/api/mcp/connect-claude-code", async (request) => {
    const settingsPath = path.join(os.homedir(), ".claude", "settings.json");

    try {
      let settings: Record<string, any> = {};

      if (fs.existsSync(settingsPath)) {
        const content = fs.readFileSync(settingsPath, "utf-8");
        settings = JSON.parse(content);
      } else {
        // Create .claude directory if it doesn't exist
        fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
      }

      // Initialize mcpServers if not present
      if (!settings.mcpServers) {
        settings.mcpServers = {};
      }

      const mcpPort = Number(process.env.MCP_PORT) || 3132;
      const mcpToken = process.env.MCP_AUTH_TOKEN || "";

      // Add or update the Ō MCP server config
      settings.mcpServers["o-mcp"] = {
        command: "npx",
        args: ["o-mcp"],
        env: {
          ...(mcpToken ? { MCP_AUTH_TOKEN: mcpToken } : {}),
        },
      };

      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");

      return {
        ok: true,
        message: "Ō MCP server connected to Claude Code",
        settingsPath,
      };
    } catch (err: any) {
      return {
        ok: false,
        error: err.message,
        manual: {
          instruction:
            "Add this to your ~/.claude/settings.json under mcpServers:",
          config: {
            "o-mcp": {
              command: "npx",
              args: ["o-mcp"],
            },
          },
        },
      };
    }
  });

  app.get("/api/mcp/status", async () => {
    const settingsPath = path.join(os.homedir(), ".claude", "settings.json");

    try {
      if (!fs.existsSync(settingsPath)) {
        return { connected: false, reason: "settings.json not found" };
      }

      const content = fs.readFileSync(settingsPath, "utf-8");
      const settings = JSON.parse(content);

      const isConnected = !!settings.mcpServers?.["o-mcp"];
      return { connected: isConnected };
    } catch {
      return { connected: false, reason: "Could not read settings" };
    }
  });
}
