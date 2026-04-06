import { useState, useEffect } from "react";

interface Section {
  title: string;
  level: number;
  content: string;
}

interface ClaudeMdEntry {
  label: string;
  filePath: string;
  content: string;
  sections: Section[];
}

interface Props {
  search: string;
  onCount: (n: number) => void;
}

export function ClaudeMdCards({ search, onCount }: Props) {
  const [entries, setEntries] = useState<ClaudeMdEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    fetch("/api/claude-md")
      .then((r) => r.json())
      .then((data: ClaudeMdEntry[]) => {
        setEntries(data);
        onCount(data.length);
      })
      .catch(() => {});
  }, [onCount]);

  const filtered = search
    ? entries.filter(
        (e) =>
          e.label.toLowerCase().includes(search.toLowerCase()) ||
          e.content.toLowerCase().includes(search.toLowerCase()),
      )
    : entries;

  const handleSave = async (filePath: string) => {
    await fetch("/api/claude-md", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: filePath, content: editContent }),
    });
    setEditing(null);
    // Refresh
    const data = await fetch("/api/claude-md").then((r) => r.json());
    setEntries(data);
  };

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 py-8 text-center text-sm text-zinc-600">
        {search ? "Nenhum CLAUDE.md encontrado" : "Nenhum CLAUDE.md no sistema"}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map((entry) => (
        <div
          key={entry.filePath}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() =>
                setExpanded(expanded === entry.filePath ? null : entry.filePath)
              }
              className="flex items-center gap-3 text-left"
            >
              <svg
                className={`h-3 w-3 text-zinc-500 transition ${
                  expanded === entry.filePath ? "rotate-180" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
              <div>
                <span className="text-sm font-medium text-zinc-100">
                  {entry.label}
                </span>
                <span className="ml-2 text-xs text-zinc-600">
                  {entry.sections.length} seções
                </span>
              </div>
            </button>
            <button
              onClick={() => {
                if (editing === entry.filePath) {
                  setEditing(null);
                } else {
                  setEditContent(entry.content);
                  setEditing(entry.filePath);
                  setExpanded(entry.filePath);
                }
              }}
              className="rounded border border-zinc-700 px-2.5 py-1 text-[10px] text-zinc-400 hover:border-zinc-500 hover:text-white"
            >
              {editing === entry.filePath ? "Cancelar" : "Editar"}
            </button>
          </div>

          {/* Expanded content */}
          {expanded === entry.filePath && (
            <div className="border-t border-zinc-800">
              {editing === entry.filePath ? (
                <div className="p-4 space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="h-[40vh] w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-xs text-zinc-100 outline-none focus:border-zinc-500"
                    spellCheck={false}
                  />
                  <button
                    onClick={() => handleSave(entry.filePath)}
                    className="rounded bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-zinc-200"
                  >
                    Salvar
                  </button>
                </div>
              ) : (
                <div>
                  {entry.sections.map((section, i) => (
                    <SectionRow key={i} section={section} search={search} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SectionRow({ section, search }: { section: Section; search: string }) {
  const matchesSearch =
    search &&
    (section.title.toLowerCase().includes(search.toLowerCase()) ||
      section.content.toLowerCase().includes(search.toLowerCase()));

  const [open, setOpen] = useState(!!matchesSearch);

  return (
    <div className="border-b border-zinc-800/30 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between px-4 py-2 text-left hover:bg-zinc-800/30 ${
          matchesSearch ? "bg-zinc-800/20" : ""
        }`}
      >
        <span
          className={`${
            section.level === 1
              ? "text-xs font-medium text-zinc-100"
              : section.level === 2
                ? "ml-3 text-xs text-zinc-300"
                : "ml-6 text-[11px] text-zinc-500"
          }`}
        >
          {section.title}
        </span>
        {section.content && (
          <svg
            className={`h-2.5 w-2.5 shrink-0 text-zinc-600 transition ${
              open ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
      </button>
      {open && section.content && (
        <div className="bg-zinc-950/50 px-4 py-2">
          <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-500 font-mono">
            {section.content}
          </pre>
        </div>
      )}
    </div>
  );
}
