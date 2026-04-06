import { useState, useEffect } from "react";

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
}

interface Marketplace {
  name: string;
  source: string;
  repo?: string;
}

interface Props {
  search: string;
}

export function EcosystemBar({ search }: Props) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [showAllPlugins, setShowAllPlugins] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/plugins").then((r) => r.json()),
      fetch("/api/mcp-servers").then((r) => r.json()),
      fetch("/api/marketplaces").then((r) => r.json()),
    ]).then(([p, m, mk]) => {
      setPlugins(p);
      setMcpServers(m);
      setMarketplaces(mk);
    }).catch(() => {});
  }, []);

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

  const filteredPlugins = search
    ? plugins.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : plugins;

  const filteredMcp = search
    ? mcpServers.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : mcpServers;

  const enabledCount = plugins.filter((p) => p.enabled).length;

  return (
    <div className="space-y-4">
      {/* Plugins summary + grid */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-100">Plugins</span>
            <span className="text-xs text-zinc-500">
              {enabledCount} ativos de {plugins.length}
            </span>
          </div>
          <button
            onClick={() => setShowAllPlugins(!showAllPlugins)}
            className="text-[10px] text-zinc-500 hover:text-zinc-300"
          >
            {showAllPlugins ? "Recolher" : "Ver todos"}
          </button>
        </div>

        {/* Visual bar */}
        <div className="mt-3 flex gap-0.5">
          {filteredPlugins.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePlugin(p.id, !p.enabled)}
              title={`${p.name} (${p.enabled ? "ativo" : "inativo"})`}
              className={`h-2 flex-1 rounded-full transition ${
                p.enabled
                  ? "bg-emerald-500 hover:bg-emerald-400"
                  : "bg-zinc-700 hover:bg-zinc-600"
              }`}
            />
          ))}
        </div>

        {/* Full list */}
        {showAllPlugins && (
          <div className="mt-4 grid grid-cols-2 gap-1 sm:grid-cols-3">
            {filteredPlugins.map((p) => (
              <button
                key={p.id}
                onClick={() => togglePlugin(p.id, !p.enabled)}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition ${
                  p.enabled
                    ? "bg-zinc-800/80 hover:bg-zinc-800"
                    : "bg-zinc-900/30 opacity-50 hover:opacity-75"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    p.enabled ? "bg-emerald-400" : "bg-zinc-600"
                  }`}
                />
                <span className="truncate text-[11px] text-zinc-300">
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MCP Servers */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-4">
        <span className="text-sm font-medium text-zinc-100">MCP Servers</span>
        <div className="mt-3 flex flex-wrap gap-2">
          {filteredMcp.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-2 rounded-lg bg-zinc-800/60 px-3 py-1.5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-zinc-200">{s.name}</span>
              <span className="text-[10px] text-zinc-600">{s.type}</span>
            </div>
          ))}
          {filteredMcp.length === 0 && (
            <span className="text-xs text-zinc-600">Nenhum configurado</span>
          )}
        </div>
      </div>

      {/* Marketplaces */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-4">
        <span className="text-sm font-medium text-zinc-100">Marketplaces</span>
        <div className="mt-3 flex flex-wrap gap-2">
          {marketplaces.map((mk) => (
            <div
              key={mk.name}
              className="rounded-lg bg-zinc-800/60 px-3 py-1.5"
            >
              <span className="text-xs text-zinc-200">{mk.name}</span>
              {mk.repo && (
                <span className="ml-1.5 text-[10px] text-zinc-600">
                  {mk.repo}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
