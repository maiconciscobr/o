import type { View } from "../App";

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full w-14 flex-col items-center border-r border-zinc-800 bg-zinc-950 py-4">
      <div className="mb-8 text-lg font-extralight text-zinc-100">O</div>

      <nav className="flex flex-col items-center gap-2">
        <NavButton
          active={currentView === "memories"}
          onClick={() => onNavigate("memories")}
          title="Memórias"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 21h6M10 17v4M14 17v4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </NavButton>

        <NavButton
          active={currentView === "claude-md"}
          onClick={() => onNavigate("claude-md")}
          title="CLAUDE.md"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </NavButton>

        <NavButton
          active={currentView === "ecosystem"}
          onClick={() => onNavigate("ecosystem")}
          title="Ecossistema"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </NavButton>
      </nav>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-lg p-2 transition ${
        active
          ? "bg-zinc-800 text-white"
          : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}
