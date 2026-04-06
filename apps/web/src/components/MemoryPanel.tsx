import { useState } from "react";
import { useMemories } from "../hooks/use-memories";

const CATEGORY_LABELS: Record<string, string> = {
  preference: "Preferences",
  fact: "Facts",
  constraint: "Constraints",
  project: "Project context",
  other: "Other",
};

const CATEGORY_ORDER = ["preference", "fact", "constraint", "project", "other"];

export function MemoryPanel() {
  const { grouped, loading, add, remove } = useMemories();
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("fact");
  const [newImportance, setNewImportance] = useState(5);

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    await add(newContent.trim(), newCategory, newImportance);
    setNewContent("");
    setAdding(false);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        Loading memories...
      </div>
    );
  }

  const hasMemories = Object.keys(grouped).length > 0;

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-light text-zinc-100">
          What O knows about you
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Everything here is sent to your AI agents via MCP. Edit or delete
          anything at any time.
        </p>

        {/* Add button */}
        <div className="mt-6">
          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className="rounded-lg border border-dashed border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-300"
            >
              + Add memory
            </button>
          ) : (
            <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-900 p-4">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="What should O remember?"
                className="w-full resize-none rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500"
                rows={2}
                autoFocus
              />
              <div className="flex items-center gap-4">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-300"
                >
                  {CATEGORY_ORDER.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">Importance:</span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={newImportance}
                    onChange={(e) => setNewImportance(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-xs text-zinc-400">{newImportance}/10</span>
                </div>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => setAdding(false)}
                    className="rounded px-3 py-1 text-sm text-zinc-400 hover:text-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!newContent.trim()}
                    className="rounded bg-white px-3 py-1 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-30"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Memory list by category */}
        {!hasMemories && (
          <div className="mt-12 text-center text-sm text-zinc-600">
            No memories yet. Start chatting with O or add one manually.
          </div>
        )}

        <div className="mt-8 space-y-8">
          {CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) => (
            <div key={cat}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {CATEGORY_LABELS[cat]}
              </h2>
              <div className="space-y-2">
                {grouped[cat].map((memory) => (
                  <MemoryItem
                    key={memory.id}
                    content={memory.content}
                    importance={memory.importance}
                    onDelete={() => remove(memory.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MemoryItem({
  content,
  importance,
  onDelete,
}: {
  content: string;
  importance: number;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      {/* Importance bar */}
      <div className="mt-1 flex flex-col items-center gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 w-3 rounded-full ${
              i < importance ? "bg-white" : "bg-zinc-800"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <p className="flex-1 text-sm leading-relaxed text-zinc-300">{content}</p>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="shrink-0 text-zinc-600 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
        title="Delete memory"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
