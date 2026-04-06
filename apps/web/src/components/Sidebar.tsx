interface SidebarProps {
  currentView: "chat" | "memories";
  onNavigate: (view: "chat" | "memories") => void;
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full w-14 flex-col items-center border-r border-zinc-800 bg-zinc-950 py-4">
      {/* Logo */}
      <div className="mb-8 text-lg font-extralight text-zinc-100">O</div>

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-2">
        <NavButton
          active={currentView === "chat"}
          onClick={() => onNavigate("chat")}
          title="Chat"
        >
          {/* Chat icon */}
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </NavButton>

        <NavButton
          active={currentView === "memories"}
          onClick={() => onNavigate("memories")}
          title="Memories"
        >
          {/* Brain icon */}
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 21h6M10 17v4M14 17v4" strokeLinecap="round" strokeLinejoin="round" />
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
