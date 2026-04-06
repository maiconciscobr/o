import { useState, useEffect } from "react";
import { McpStatus } from "./components/McpStatus";
import { MemoryCards } from "./components/MemoryCards";
import { ClaudeMdCards } from "./components/ClaudeMdCards";
import { EcosystemBar } from "./components/EcosystemBar";

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-xl font-extralight tracking-wide">Ō</span>
          <McpStatus />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Stats bar */}
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
        <div className="mt-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar em tudo..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-600"
          />
        </div>

        {/* Memories */}
        <section className="mt-10">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Memórias
          </h2>
          <MemoryCards search={search} onCount={setMemoryCount} />
        </section>

        {/* CLAUDE.md */}
        <section className="mt-10">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Instruções (CLAUDE.md)
          </h2>
          <ClaudeMdCards search={search} onCount={setClaudeMdCount} />
        </section>

        {/* Ecosystem */}
        <section className="mt-10 pb-16">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Ecossistema
          </h2>
          <EcosystemBar search={search} />
        </section>
      </div>
    </div>
  );
}
