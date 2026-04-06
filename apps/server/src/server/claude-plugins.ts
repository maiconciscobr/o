import type { FastifyInstance } from "fastify";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

interface PluginInfo {
  id: string; // e.g. "vercel@claude-plugins-official"
  name: string; // e.g. "vercel"
  marketplace: string; // e.g. "claude-plugins-official"
  enabled: boolean;
}

interface McpServerInfo {
  name: string;
  type: string;
  command?: string;
  args?: string[];
  url?: string;
}

interface MarketplaceInfo {
  name: string;
  source: string;
  repo?: string;
}

function getSettingsPath(): string {
  return path.join(os.homedir(), ".claude", "settings.json");
}

function getClaudeJsonPath(): string {
  return path.join(os.homedir(), ".claude.json");
}

function readJson(filePath: string): Record<string, any> {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeSettings(data: Record<string, any>): void {
  fs.writeFileSync(getSettingsPath(), JSON.stringify(data, null, 2), "utf-8");
}

export function registerPluginRoutes(app: FastifyInstance): void {
  // ─── Plugins ──────────────────────────────────────────────────

  app.get("/api/plugins", async () => {
    const settings = readJson(getSettingsPath());
    const enabledPlugins = settings.enabledPlugins || {};

    const plugins: PluginInfo[] = Object.entries(enabledPlugins).map(
      ([id, enabled]) => {
        const parts = id.split("@");
        return {
          id,
          name: parts[0],
          marketplace: parts.slice(1).join("@"),
          enabled: enabled as boolean,
        };
      },
    );

    // Sort: enabled first, then alphabetical
    plugins.sort((a, b) => {
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return plugins;
  });

  app.put("/api/plugins/:id", async (request) => {
    const { id } = request.params as { id: string };
    const { enabled } = request.body as { enabled: boolean };

    const settings = readJson(getSettingsPath());
    if (!settings.enabledPlugins) settings.enabledPlugins = {};
    settings.enabledPlugins[id] = enabled;
    writeSettings(settings);

    return { ok: true, id, enabled };
  });

  // ─── MCP Servers ──────────────────────────────────────────────

  app.get("/api/mcp-servers", async () => {
    const config = readJson(getClaudeJsonPath());
    const servers = config.mcpServers || {};

    const result: McpServerInfo[] = Object.entries(servers).map(
      ([name, conf]: [string, any]) => ({
        name,
        type: conf.type || "stdio",
        command: conf.command,
        args: conf.args,
        url: conf.url,
      }),
    );

    return result;
  });

  app.delete("/api/mcp-servers/:name", async (request) => {
    const { name } = request.params as { name: string };
    const config = readJson(getClaudeJsonPath());

    if (config.mcpServers?.[name]) {
      delete config.mcpServers[name];
      fs.writeFileSync(getClaudeJsonPath(), JSON.stringify(config, null, 2), "utf-8");
      return { ok: true };
    }
    return { ok: false };
  });

  // ─── Marketplaces ─────────────────────────────────────────────

  app.get("/api/marketplaces", async () => {
    const settings = readJson(getSettingsPath());
    const marketplaces = settings.extraKnownMarketplaces || {};

    const result: MarketplaceInfo[] = Object.entries(marketplaces).map(
      ([name, conf]: [string, any]) => ({
        name,
        source: conf.source?.source || "unknown",
        repo: conf.source?.repo,
      }),
    );

    return result;
  });

  // ─── Overview (tudo junto) ────────────────────────────────────

  app.get("/api/overview", async () => {
    const settings = readJson(getSettingsPath());
    const claudeJson = readJson(getClaudeJsonPath());

    const plugins = Object.entries(settings.enabledPlugins || {});
    const enabledCount = plugins.filter(([, v]) => v).length;
    const totalCount = plugins.length;

    const mcpServers = Object.keys(claudeJson.mcpServers || {});
    const marketplaces = Object.keys(settings.extraKnownMarketplaces || {});

    return {
      plugins: { enabled: enabledCount, total: totalCount },
      mcpServers: mcpServers.length,
      marketplaces: marketplaces.length,
      model: settings.model || process.env.CLAUDE_MODEL || "default",
      effortLevel: settings.effortLevel || "default",
    };
  });
}
