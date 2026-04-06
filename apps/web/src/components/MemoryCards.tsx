import { useState, useEffect } from "react";

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

interface Props {
  search: string;
  onCount: (n: number) => void;
}

export function MemoryCards({ search, onCount }: Props) {
  const [projects, setProjects] = useState<ProjectMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {filtered.map((project, index) => (
        <div
          key={project.projectPath}
          style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
          className="animate-[fade-in-up_300ms_ease-out_both]"
        >
          {/* Card */}
          <button
            onClick={() =>
              setExpanded(expanded === project.projectPath ? null : project.projectPath)
            }
            className={`card-glow w-full rounded-xl border px-4 py-4 text-left transition-all duration-200 ease-out ${
              expanded === project.projectPath
                ? "border-zinc-600 bg-zinc-900 shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
                : "border-zinc-800 hover:-translate-y-0.5 hover:border-zinc-600 hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
            }`}
            style={{ backgroundColor: "var(--bg-surface)" }}
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

          {/* Expanded list with collapse animation */}
          <div
            className={`grid transition-[grid-template-rows] duration-200 ease-out ${
              expanded === project.projectPath ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div className="mt-1 space-y-1 pt-1">
                {project.memories.map((m, mi) => (
                  <div
                    key={m.filePath}
                    style={{ animationDelay: `${mi * 30}ms` }}
                    className={`rounded-lg border border-zinc-800/50 animate-[fade-in-up_200ms_ease-out_both] ${
                      expanded === project.projectPath ? "" : "invisible"
                    }`}
                    {...{ style: { backgroundColor: "var(--bg-surface)", animationDelay: `${mi * 30}ms` } }}
                  >
                    <button
                      onClick={() =>
                        setOpenMemory(openMemory === m.filePath ? null : m.filePath)
                      }
                      className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors duration-150 hover:bg-white/[0.02] rounded-lg"
                    >
                      <span
                        className={`mt-0.5 shrink-0 rounded px-1 py-0.5 text-[9px] font-medium uppercase ${
                          TYPE_COLORS[m.type] || TYPE_COLORS.other
                        }`}
                      >
                        {m.type}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-zinc-200 truncate">
                          {m.name}
                        </p>
                        {m.description && (
                          <p className="mt-0.5 text-[10px] text-zinc-500 truncate">
                            {m.description}
                          </p>
                        )}
                      </div>
                    </button>

                    <div
                      className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                        openMemory === m.filePath ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="border-t border-zinc-800/50 px-3 py-2">
                          <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-400 font-mono">
                            {m.content}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
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
