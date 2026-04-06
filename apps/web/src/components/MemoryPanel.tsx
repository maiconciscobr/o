import { useState, useEffect, useCallback } from "react";

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
  index: string;
  memories: MemoryFile[];
}

const TYPE_LABELS: Record<string, string> = {
  user: "Sobre você",
  feedback: "Feedback",
  project: "Projeto",
  reference: "Referência",
  other: "Outros",
};

const TYPE_COLORS: Record<string, string> = {
  user: "bg-blue-500/20 text-blue-300",
  feedback: "bg-amber-500/20 text-amber-300",
  project: "bg-emerald-500/20 text-emerald-300",
  reference: "bg-purple-500/20 text-purple-300",
  other: "bg-zinc-500/20 text-zinc-400",
};

export function MemoryPanel() {
  const [projects, setProjects] = useState<ProjectMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/claude-memory");
      const data = await res.json();
      setProjects(data);
      // Expand all by default
      setExpanded(new Set(data.map((p: ProjectMemory) => p.projectPath)));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = (projectPath: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(projectPath)) next.delete(projectPath);
      else next.add(projectPath);
      return next;
    });
  };

  const totalMemories = projects.reduce((sum, p) => sum + p.memories.length, 0);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        Carregando memórias...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-light text-zinc-100">
          O que o Claude sabe sobre você
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {totalMemories} memórias em {projects.length} projeto{projects.length !== 1 ? "s" : ""} — lidas de ~/.claude/projects/
        </p>

        {projects.length === 0 && (
          <div className="mt-12 text-center text-sm text-zinc-600">
            Nenhuma memória encontrada. O Claude Code ainda não criou memórias automáticas.
          </div>
        )}

        <div className="mt-8 space-y-4">
          {projects.map((project) => (
            <div key={project.projectPath} className="rounded-lg border border-zinc-800">
              {/* Project header */}
              <button
                onClick={() => toggle(project.projectPath)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <span className="text-sm font-medium text-zinc-100">
                    {project.project}
                  </span>
                  <span className="ml-2 text-xs text-zinc-600">
                    {project.memories.length} memória{project.memories.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <svg
                  className={`h-4 w-4 text-zinc-500 transition ${
                    expanded.has(project.projectPath) ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Memories */}
              {expanded.has(project.projectPath) && (
                <div className="border-t border-zinc-800">
                  {project.memories.map((memory) => (
                    <MemoryCard key={memory.filePath} memory={memory} />
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

function MemoryCard({ memory }: { memory: MemoryFile }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-zinc-800/50 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-zinc-900/50"
      >
        <span
          className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
            TYPE_COLORS[memory.type] || TYPE_COLORS.other
          }`}
        >
          {TYPE_LABELS[memory.type] || memory.type}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-200">{memory.name}</p>
          {memory.description && (
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {memory.description}
            </p>
          )}
        </div>
        <svg
          className={`mt-1 h-3 w-3 shrink-0 text-zinc-600 transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="bg-zinc-900/30 px-4 py-3">
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-400 font-mono">
            {memory.content}
          </pre>
        </div>
      )}
    </div>
  );
}
