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
            <div className="mt-3 h-8 w-full rounded skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Plugins */}
      <div
        className="card-glow rounded-xl border border-zinc-800 px-5 py-5 transition-all duration-200 hover:border-zinc-700 animate-[fade-in-up_300ms_ease-out_both]"
        style={{ backgroundColor: "var(--bg-surface)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-100">Plugins</span>
            <span className="text-xs text-zinc-500">
              {enabledCount}/{plugins.length} ativos
            </span>
          </div>
        </div>

        <div className="space-y-0.5">
          {filteredPlugins.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors duration-150 hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm text-zinc-200 truncate">{p.name}</span>
                <span className="shrink-0 text-[10px] text-zinc-600">{p.marketplace}</span>
              </div>
              <button
                role="switch"
                aria-checked={p.enabled}
                onClick={() => togglePlugin(p.id, !p.enabled)}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
                  p.enabled ? "bg-emerald-500" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    p.enabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MCP Servers */}
      <div
        className="card-glow rounded-xl border border-zinc-800 px-5 py-5 transition-all duration-200 hover:border-zinc-700 animate-[fade-in-up_300ms_ease-out_both]"
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
        className="card-glow rounded-xl border border-zinc-800 px-5 py-5 transition-all duration-200 hover:border-zinc-700 animate-[fade-in-up_300ms_ease-out_both]"
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
                <span className="ml-1.5 text-[10px] text-zinc-600">{mk.repo}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
