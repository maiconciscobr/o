import { useState, useEffect } from "react";
import { McpStatus } from "./components/McpStatus";
import { MemoryCards } from "./components/MemoryCards";
import { ClaudeMdCards } from "./components/ClaudeMdCards";
import { EcosystemBar } from "./components/EcosystemBar";
import { ChatPanel } from "./components/ChatPanel";

interface Overview {
  plugins: { enabled: number; total: number };
  mcpServers: number;
  marketplaces: number;
}

export function App() {
  const [search, setSearch] = useState("");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [memoryCount, setMemoryCount] = useState(0);
  const [claudeMdCount, setClaudeMdCount] = useState(0);

  useEffect(() => {
    fetch("/api/overview").then((r) => r.json()).then(setOverview).catch(() => {});
  }, []);

  return (
    <div className="flex h-screen text-zinc-100" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Dashboard — 2/3 */}
      <div className="flex-[2] overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b backdrop-blur" style={{ borderColor: "var(--border-subtle)", backgroundColor: "oklch(0.13 0.005 260 / 0.85)" }}>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-xl font-extralight tracking-wide">Ō</span>
            <McpStatus />
          </div>
        </header>

        <div className="px-6 py-8">
          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span>{memoryCount} memórias</span>
            <span className="text-zinc-700">·</span>
            <span>{claudeMdCount} CLAUDE.md</span>
            {overview && (
              <>
                <span className="text-zinc-700">·</span>
                <span>{overview.plugins.enabled}/{overview.plugins.total} plugins</span>
                <span className="text-zinc-700">·</span>
                <span>{overview.mcpServers} MCP servers</span>
              </>
            )}
          </div>

          {/* Search */}
          <div className="group relative mt-6">
            <svg
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600 transition-colors duration-200 group-focus-within:text-zinc-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar em tudo..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-11 pr-5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-[border-color,box-shadow] duration-200 focus:border-zinc-600 focus:shadow-[0_0_0_3px_rgba(113,113,122,0.1)]"
            />
          </div>

          {/* Sections */}
          <section className="mt-10">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Memórias
            </h2>
            <MemoryCards search={search} onCount={setMemoryCount} />
          </section>

          <section className="mt-10">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Instruções (CLAUDE.md)
            </h2>
            <ClaudeMdCards search={search} onCount={setClaudeMdCount} />
          </section>

          <section className="mt-10 pb-16">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Ecossistema
            </h2>
            <EcosystemBar search={search} />
          </section>
        </div>
      </div>

      {/* Chat — 1/3 */}
      <div className="flex-1">
        <ChatPanel />
      </div>
    </div>
  );
}
