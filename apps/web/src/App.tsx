import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatWindow } from "./components/ChatWindow";
import { MemoryPanel } from "./components/MemoryPanel";
import { ClaudeMdViewer } from "./components/ClaudeMdViewer";
import { McpStatus } from "./components/McpStatus";
import { Onboarding } from "./components/Onboarding";

export type View = "chat" | "memories" | "claude-md";

const ONBOARDING_KEY = "o-onboarding-complete";

const VIEW_LABELS: Record<View, string> = {
  chat: "Chat",
  memories: "Memórias",
  "claude-md": "CLAUDE.md",
};

export function App() {
  const [view, setView] = useState<View>("chat");
  const [onboarded] = useState(() => {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  });

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    window.location.reload();
  };

  if (!onboarded) {
    return (
      <div className="h-screen bg-zinc-950 text-zinc-100">
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

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
          {view === "chat" && <ChatWindow />}
          {view === "memories" && <MemoryPanel />}
          {view === "claude-md" && <ClaudeMdViewer />}
        </main>
      </div>
    </div>
  );
}
