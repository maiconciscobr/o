import { useState, useEffect, useCallback } from "react";

interface Plugin {
  id: string;
  name: string;
  marketplace: string;
  enabled: boolean;
}

interface McpServer {
  name: string;
  type: string;
  command?: string;
  args?: string[];
  url?: string;
}

interface Marketplace {
  name: string;
  source: string;
  repo?: string;
}

type SubTab = "plugins" | "mcp" | "marketplaces";

export function PluginsPanel() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<SubTab>("plugins");
  const [filter, setFilter] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [p, m, mk] = await Promise.all([
        fetch("/api/plugins").then((r) => r.json()),
        fetch("/api/mcp-servers").then((r) => r.json()),
        fetch("/api/marketplaces").then((r) => r.json()),
      ]);
      setPlugins(p);
      setMcpServers(m);
      setMarketplaces(mk);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const togglePlugin = async (id: string, enabled: boolean) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled } : p)),
    );
    await fetch(`/api/plugins/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
  };

  const enabledCount = plugins.filter((p) => p.enabled).length;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        Carregando configuração...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-light text-zinc-100">Ecossistema</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {enabledCount} plugins ativos · {mcpServers.length} MCP servers · {marketplaces.length} marketplaces
        </p>

        {/* Sub-tabs */}
        <div className="mt-6 flex gap-1 rounded-lg bg-zinc-900 p-1">
          <SubTabButton active={subTab === "plugins"} onClick={() => setSubTab("plugins")}>
            Plugins ({plugins.length})
          </SubTabButton>
          <SubTabButton active={subTab === "mcp"} onClick={() => setSubTab("mcp")}>
            MCP Servers ({mcpServers.length})
          </SubTabButton>
          <SubTabButton active={subTab === "marketplaces"} onClick={() => setSubTab("marketplaces")}>
            Marketplaces ({marketplaces.length})
          </SubTabButton>
        </div>

        {/* Filter */}
        {subTab === "plugins" && (
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar plugins..."
            className="mt-4 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500"
          />
        )}

        {/* Content */}
        <div className="mt-4">
          {subTab === "plugins" && (
            <PluginsList
              plugins={plugins}
              filter={filter}
              onToggle={togglePlugin}
            />
          )}
          {subTab === "mcp" && <McpServersList servers={mcpServers} />}
          {subTab === "marketplaces" && <MarketplacesList marketplaces={marketplaces} />}
        </div>
      </div>
    </div>
  );
}

function PluginsList({
  plugins,
  filter,
  onToggle,
}: {
  plugins: Plugin[];
  filter: string;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const filtered = filter
    ? plugins.filter(
        (p) =>
          p.name.toLowerCase().includes(filter.toLowerCase()) ||
          p.marketplace.toLowerCase().includes(filter.toLowerCase()),
      )
    : plugins;

  return (
    <div className="space-y-1">
      {filtered.map((plugin) => (
        <div
          key={plugin.id}
          className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3 hover:bg-zinc-900/50"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-100">
                {plugin.name}
              </span>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                {plugin.marketplace}
              </span>
            </div>
          </div>
          <button
            onClick={() => onToggle(plugin.id, !plugin.enabled)}
            className={`relative h-6 w-11 rounded-full transition ${
              plugin.enabled ? "bg-emerald-500" : "bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                plugin.enabled ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}

function McpServersList({ servers }: { servers: McpServer[] }) {
  return (
    <div className="space-y-2">
      {servers.map((server) => (
        <div
          key={server.name}
          className="rounded-lg border border-zinc-800 px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-sm font-medium text-zinc-100">
              {server.name}
            </span>
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
              {server.type}
            </span>
          </div>
          {server.command && (
            <p className="mt-1 font-mono text-xs text-zinc-600">
              {server.command} {server.args?.join(" ")}
            </p>
          )}
        </div>
      ))}
      {servers.length === 0 && (
        <div className="text-center text-sm text-zinc-600 py-8">
          Nenhum MCP server configurado.
        </div>
      )}
    </div>
  );
}

function MarketplacesList({ marketplaces }: { marketplaces: Marketplace[] }) {
  return (
    <div className="space-y-2">
      {marketplaces.map((mk) => (
        <div
          key={mk.name}
          className="rounded-lg border border-zinc-800 px-4 py-3"
        >
          <span className="text-sm font-medium text-zinc-100">{mk.name}</span>
          {mk.repo && (
            <p className="mt-1 text-xs text-zinc-500">{mk.repo}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function SubTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-2 text-sm transition ${
        active ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}
