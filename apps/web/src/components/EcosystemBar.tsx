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
  const [loading, setLoading] = useState(true);
  const [showAllPlugins, setShowAllPlugins] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/plugins").then((r) => r.json()),
      fetch("/api/mcp-servers").then((r) => r.json()),
      fetch("/api/marketplaces").then((r) => r.json()),
    ])
      .then(([p, m, mk]) => {
        setPlugins(p);
        setMcpServers(m);
        setMarketplaces(mk);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-800 px-4 py-4" style={{ backgroundColor: "var(--bg-surface)" }}>
            <div className="h-4 w-24 rounded skeleton-shimmer" />
            <div className="mt-3 h-2 w-full rounded skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Plugins */}
      <div
        className="card-glow rounded-xl border border-zinc-800 px-4 py-4 transition-all duration-200 hover:border-zinc-700 animate-[fade-in-up_300ms_ease-out_both]"
        style={{ backgroundColor: "var(--bg-surface)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-100">Plugins</span>
            <span className="text-xs text-zinc-500">
              {enabledCount} ativos de {plugins.length}
            </span>
          </div>
          <button
            onClick={() => setShowAllPlugins(!showAllPlugins)}
            className="text-[10px] text-zinc-500 transition-colors duration-150 hover:text-zinc-300"
          >
            {showAllPlugins ? "Recolher" : "Ver todos"}
          </button>
        </div>

        {/* Visual bar with tooltips */}
        <div className="mt-3 flex gap-0.5">
          {filteredPlugins.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePlugin(p.id, !p.enabled)}
              className={`group relative flex-1 rounded-full transition-all duration-200 ${
                p.enabled
                  ? "h-2 bg-emerald-500 hover:h-3 hover:bg-emerald-400"
                  : "h-2 bg-zinc-700 hover:h-3 hover:bg-zinc-600"
              }`}
            >
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-[10px] text-zinc-300 opacity-0 transition-opacity duration-150 group-hover:opacity-100 shadow-lg" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                {p.name}
              </span>
            </button>
          ))}
        </div>

        {/* Full list */}
        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            showAllPlugins ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="mt-4 grid grid-cols-2 gap-1 sm:grid-cols-3">
              {filteredPlugins.map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePlugin(p.id, !p.enabled)}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-all duration-150 ${
                    p.enabled
                      ? "bg-zinc-800/80 hover:bg-zinc-800"
                      : "bg-zinc-900/30 opacity-40 hover:opacity-70"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-200 ${
                      p.enabled ? "bg-emerald-400" : "bg-zinc-600"
                    }`}
                  />
                  <span className="truncate text-[11px] text-zinc-300">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MCP Servers */}
      <div
        className="card-glow rounded-xl border border-zinc-800 px-4 py-4 transition-all duration-200 hover:border-zinc-700 animate-[fade-in-up_300ms_ease-out_both]"
        style={{ backgroundColor: "var(--bg-surface)", animationDelay: "60ms" }}
      >
        <span className="text-sm font-medium text-zinc-100">MCP Servers</span>
        <div className="mt-3 flex flex-wrap gap-2">
          {filteredMcp.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-2 rounded-lg bg-zinc-800/60 px-3 py-1.5 transition-colors duration-150 hover:bg-zinc-800"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
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
      <div
        className="card-glow rounded-xl border border-zinc-800 px-4 py-4 transition-all duration-200 hover:border-zinc-700 animate-[fade-in-up_300ms_ease-out_both]"
        style={{ backgroundColor: "var(--bg-surface)", animationDelay: "120ms" }}
      >
        <span className="text-sm font-medium text-zinc-100">Marketplaces</span>
        <div className="mt-3 flex flex-wrap gap-2">
          {marketplaces.map((mk) => (
            <div
              key={mk.name}
              className="rounded-lg bg-zinc-800/60 px-3 py-1.5 transition-colors duration-150 hover:bg-zinc-800"
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
