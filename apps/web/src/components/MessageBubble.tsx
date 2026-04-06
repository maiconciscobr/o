interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  toolUses?: { name: string; input: unknown }[];
}

export function MessageBubble({ role, content, toolUses }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-white text-black"
            : "bg-zinc-800 text-zinc-100"
        }`}
      >
        {toolUses && toolUses.length > 0 && (
          <div className="mb-2 space-y-1">
            {toolUses.map((t, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded bg-zinc-700/50 px-2 py-1 text-xs text-zinc-400"
              >
                <span className="font-mono">{t.name}</span>
              </div>
            ))}
          </div>
        )}
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}
