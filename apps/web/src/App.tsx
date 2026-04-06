import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatWindow } from "./components/ChatWindow";
import { MemoryPanel } from "./components/MemoryPanel";
import { McpStatus } from "./components/McpStatus";
import { Onboarding } from "./components/Onboarding";

type View = "chat" | "memories";

const ONBOARDING_KEY = "o-onboarding-complete";

export function App() {
  const [view, setView] = useState<View>("chat");
  const [onboarded, setOnboarded] = useState(() => {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  });

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOnboarded(true);
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
      {/* Sidebar */}
      <Sidebar currentView={view} onNavigate={setView} />

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
          <h2 className="text-sm font-medium text-zinc-400">
            {view === "chat" ? "Chat" : "Memories"}
          </h2>
          <McpStatus />
        </header>

        {/* View */}
        <main className="flex-1 overflow-hidden">
          {view === "chat" && <ChatWindow />}
          {view === "memories" && <MemoryPanel />}
        </main>
      </div>
    </div>
  );
}
