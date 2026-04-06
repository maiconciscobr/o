import { useState, useEffect, useCallback } from "react";
import { claudeMd, type ClaudeMdFile } from "../lib/api";

type Tab = "global" | "project";

export function ClaudeMdViewer() {
  const [files, setFiles] = useState<ClaudeMdFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("global");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await claudeMd.list();
      setFiles(data);
    } catch {
      // server might not be ready
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const current = files.find((f) => f.scope === tab);

  const handleEdit = () => {
    setEditContent(current?.content || "");
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await claudeMd.update(tab, editContent);
      setEditing(false);
      await refresh();
    } catch {
      // handle error
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
          As instruções que todo agente de IA lê antes de começar a trabalhar com você.
        </p>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-lg bg-zinc-900 p-1">
          <TabButton
            active={tab === "global"}
            onClick={() => { setTab("global"); setEditing(false); }}
          >
            Global (~/.claude/)
          </TabButton>
          <TabButton
            active={tab === "project"}
            onClick={() => { setTab("project"); setEditing(false); }}
          >
            Projeto
          </TabButton>
        </div>

        {/* Content */}
        <div className="mt-6">
          {!current?.exists ? (
            <div className="rounded-lg border border-dashed border-zinc-700 p-8 text-center">
              <p className="text-sm text-zinc-500">
                {tab === "global"
                  ? "Nenhum CLAUDE.md global encontrado em ~/.claude/"
                  : "Nenhum CLAUDE.md encontrado neste projeto"}
              </p>
              <button
                onClick={handleEdit}
                className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
              >
                Criar CLAUDE.md
              </button>
            </div>
          ) : editing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="h-[60vh] w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 p-4 font-mono text-sm text-zinc-100 outline-none focus:border-zinc-500"
                spellCheck={false}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
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
            <div>
              {/* Edit button */}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs text-zinc-600 font-mono">
                  {current.path}
                </span>
                <button
                  onClick={handleEdit}
                  className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white"
                >
                  Editar
                </button>
              </div>

              {/* Sections */}
              {current.sections.length > 0 ? (
                <div className="space-y-4">
                  {current.sections.map((section, i) => (
                    <SectionCard key={i} title={section.title} level={section.level} content={section.content} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-mono">
                    {current.content}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-2 text-sm transition ${
        active
          ? "bg-zinc-800 text-white"
          : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}

function SectionCard({
  title,
  level,
  content,
}: {
  title: string;
  level: number;
  content: string;
}) {
  const [collapsed, setCollapsed] = useState(level >= 3);

  return (
    <div
      className={`rounded-lg border border-zinc-800 bg-zinc-900/50 ${
        level === 1 ? "" : "ml-" + Math.min((level - 1) * 4, 8)
      }`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span
          className={`font-medium ${
            level === 1
              ? "text-base text-zinc-100"
              : level === 2
                ? "text-sm text-zinc-200"
                : "text-sm text-zinc-400"
          }`}
        >
          {title}
        </span>
        <svg
          className={`h-4 w-4 text-zinc-500 transition ${collapsed ? "" : "rotate-180"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {!collapsed && content && (
        <div className="border-t border-zinc-800 px-4 py-3">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400 font-mono">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}
