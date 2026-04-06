import { useState, useEffect, useCallback } from "react";
import { SideSheet } from "./SideSheet";

interface MemoryFile {
  name: string;
  description: string;
  type: string;
  content: string;
  filePath: string;
  project: string;
}

interface ProjectMemory {
  project: string;
  projectPath: string;
  memories: MemoryFile[];
}

const TYPE_COLORS: Record<string, string> = {
  user: "bg-blue-500/20 text-blue-300",
  feedback: "bg-amber-500/20 text-amber-300",
  project: "bg-emerald-500/20 text-emerald-300",
  reference: "bg-purple-500/20 text-purple-300",
  other: "bg-zinc-500/20 text-zinc-400",
};

const TYPE_LABELS: Record<string, string> = {
  user: "Sobre você",
  feedback: "Feedback",
  project: "Projeto",
  reference: "Referência",
  other: "Outros",
};

interface Props {
  search: string;
  onCount: (n: number) => void;
}

export function MemoryCards({ search, onCount }: Props) {
  const [projects, setProjects] = useState<ProjectMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProjectMemory | null>(null);
  const [openMemory, setOpenMemory] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/claude-memory")
      .then((r) => r.json())
      .then((data: ProjectMemory[]) => {
        setProjects(data);
        onCount(data.reduce((sum, p) => sum + p.memories.length, 0));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [onCount]);

  const handleClose = useCallback(() => {
    setSelected(null);
    setOpenMemory(null);
  }, []);

  if (loading) return <CardSkeleton />;

  const filtered = search
    ? projects
        .map((p) => ({
          ...p,
          memories: p.memories.filter(
            (m) =>
              m.name.toLowerCase().includes(search.toLowerCase()) ||
              m.content.toLowerCase().includes(search.toLowerCase()) ||
              m.description.toLowerCase().includes(search.toLowerCase()),
          ),
        }))
        .filter((p) => p.memories.length > 0)
    : projects;

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 py-8 text-center text-sm text-zinc-600">
        {search ? "Nenhuma memória encontrada" : "Nenhuma memória ainda"}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((project, index) => (
          <button
            key={project.projectPath}
            onClick={() => setSelected(project)}
            style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
            className="card-glow w-full animate-[fade-in-up_300ms_ease-out_both] rounded-xl border border-zinc-800 px-4 py-4 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-zinc-600 hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
            {...{ style: { backgroundColor: "var(--bg-surface)", animationDelay: `${Math.min(index * 50, 400)}ms` } }}
          >
            <p className="text-sm font-medium text-zinc-100">{project.project}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {project.memories.length} memória{project.memories.length !== 1 ? "s" : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {[...new Set(project.memories.map((m) => m.type))].map((type) => (
                <span
                  key={type}
                  className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase ${
                    TYPE_COLORS[type] || TYPE_COLORS.other
                  }`}
                >
                  {type}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Side Sheet */}
      <SideSheet
        open={!!selected}
        onClose={handleClose}
        title={selected?.project || ""}
        subtitle={`${selected?.memories.length || 0} memórias`}
      >
        {selected && (
          <div className="space-y-2">
            {selected.memories.map((m) => (
              <div
                key={m.filePath}
                className="rounded-xl border border-zinc-800/50 transition-colors duration-150"
                style={{ backgroundColor: "var(--bg-surface)" }}
              >
                <button
                  onClick={() =>
                    setOpenMemory(openMemory === m.filePath ? null : m.filePath)
                  }
                  className="flex w-full items-start gap-3 px-4 py-3 text-left rounded-xl transition-colors duration-150 hover:bg-white/[0.02]"
                >
                  <span
                    className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium uppercase ${
                      TYPE_COLORS[m.type] || TYPE_COLORS.other
                    }`}
                  >
                    {TYPE_LABELS[m.type] || m.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-200">
                      {m.name}
                    </p>
                    {m.description && (
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {m.description}
                      </p>
                    )}
                  </div>
                  <svg
                    className={`mt-1 h-3.5 w-3.5 shrink-0 text-zinc-600 transition-transform duration-200 ${
                      openMemory === m.filePath ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    openMemory === m.filePath ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t px-4 py-3" style={{ borderColor: "var(--border-subtle)" }}>
                      <pre className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-400 font-mono">
                        {m.content}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SideSheet>
    </>
  );
}

function CardSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-800 px-4 py-4"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          <div className="h-4 w-20 rounded skeleton-shimmer" />
          <div className="mt-2 h-3 w-14 rounded skeleton-shimmer" />
          <div className="mt-3 flex gap-1">
            <div className="h-4 w-10 rounded skeleton-shimmer" />
            <div className="h-4 w-12 rounded skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
