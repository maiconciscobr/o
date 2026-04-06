import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { MemoryPanel } from "./components/MemoryPanel";
import { ClaudeMdViewer } from "./components/ClaudeMdViewer";
import { PluginsPanel } from "./components/PluginsPanel";
import { McpStatus } from "./components/McpStatus";

export type View = "memories" | "claude-md" | "ecosystem";

const VIEW_LABELS: Record<View, string> = {
  memories: "Memórias",
  "claude-md": "CLAUDE.md",
  ecosystem: "Ecossistema",
};

export function App() {
  const [view, setView] = useState<View>("memories");

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <Sidebar currentView={view} onNavigate={setView} />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
          <h2 className="text-sm font-medium text-zinc-400">
            {VIEW_LABELS[view]}
          </h2>
          <McpStatus />
        </header>

        <main className="flex-1 overflow-hidden">
          {view === "memories" && <MemoryPanel />}
          {view === "claude-md" && <ClaudeMdViewer />}
          {view === "ecosystem" && <PluginsPanel />}
        </main>
      </div>
    </div>
  );
}
