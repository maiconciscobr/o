import { useState, useEffect, useCallback } from "react";

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

export function ClaudeMdViewer() {
  const [entries, setEntries] = useState<ClaudeMdEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null); // filePath being edited
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/claude-md");
      setEntries(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleEdit = (entry: ClaudeMdEntry) => {
    setEditContent(entry.content);
    setEditing(entry.filePath);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await fetch("/api/claude-md", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: editing, content: editContent }),
      });
      setEditing(null);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        Carregando CLAUDE.md...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-light text-zinc-100">CLAUDE.md</h1>
        <p className="mt-2 text-sm text-zinc-500">
          As instruções que todo agente de IA lê antes de trabalhar com você.
          {entries.length > 0 && ` ${entries.length} arquivo${entries.length !== 1 ? "s" : ""} encontrado${entries.length !== 1 ? "s" : ""}.`}
        </p>

        {entries.length === 0 && (
          <div className="mt-12 text-center text-sm text-zinc-600">
            Nenhum CLAUDE.md encontrado no sistema.
          </div>
        )}

        <div className="mt-8 space-y-6">
          {entries.map((entry) => (
            <div key={entry.filePath} className="rounded-lg border border-zinc-800">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                <div>
                  <span className="text-sm font-medium text-zinc-100">
                    {entry.label}
                  </span>
                  <span className="ml-2 font-mono text-[10px] text-zinc-600">
                    {entry.filePath}
                  </span>
                </div>
                <button
                  onClick={() => handleEdit(entry)}
                  className="rounded border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-500 hover:text-white"
                >
                  Editar
                </button>
              </div>

              {/* Editing */}
              {editing === entry.filePath ? (
                <div className="p-4 space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="h-[50vh] w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 p-4 font-mono text-sm text-zinc-100 outline-none focus:border-zinc-500"
                    spellCheck={false}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(null)}
                      className="rounded px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
                    >
                      {saving ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </div>
              ) : (
                /* Sections */
                <div>
                  {entry.sections.map((section, i) => (
                    <SectionRow key={i} section={section} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionRow({ section }: { section: Section }) {
  const [open, setOpen] = useState(section.level <= 2);

  return (
    <div className="border-b border-zinc-800/50 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-zinc-900/50"
      >
        <span
          className={`${
            section.level === 1
              ? "text-sm font-medium text-zinc-100"
              : section.level === 2
                ? "ml-3 text-sm text-zinc-200"
                : "ml-6 text-xs text-zinc-400"
          }`}
        >
          {section.title}
        </span>
        {section.content && (
          <svg
            className={`h-3 w-3 shrink-0 text-zinc-600 transition ${open ? "rotate-180" : ""}`}
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
        <div className="bg-zinc-900/30 px-4 py-3">
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-400 font-mono">
            {section.content}
          </pre>
        </div>
      )}
    </div>
  );
}
