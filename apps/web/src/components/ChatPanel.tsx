import { useState, useRef, useEffect, useMemo } from "react";
import { marked } from "marked";

// Configure marked for clean output
marked.setOptions({
  breaks: true,
  gfm: true,
});

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function RenderedMarkdown({ content }: { content: string }) {
  const html = useMemo(() => {
    if (!content) return "";
    return marked.parse(content) as string;
  }, [content]);

  return (
    <div
      className="chat-markdown"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "chunk") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + (event.text || "") }
                      : m,
                  ),
                );
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Erro: ${err.message}` }
            : m,
        ),
      );
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-full flex-col border-l" style={{ borderColor: "var(--border-subtle)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: "var(--border-subtle)" }}>
        <svg className="h-4 w-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-xs font-medium text-zinc-400">Assistente de identidade</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-zinc-500">
              Me pergunte sobre suas memórias,
              <br />
              CLAUDE.md ou plugins.
            </p>
            <div className="mt-4 space-y-2">
              {[
                "O que meu CLAUDE.md pode melhorar?",
                "Resume minhas memórias",
                "Quais plugins eu deveria desativar?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="block w-full rounded-lg border border-zinc-800 px-3 py-2 text-left text-xs text-zinc-400 transition-colors duration-150 hover:border-zinc-600 hover:text-zinc-200"
                  style={{ backgroundColor: "var(--bg-surface)" }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-white text-black"
                    : "text-zinc-200"
                }`}
                style={m.role === "assistant" ? { backgroundColor: "var(--bg-surface)" } : undefined}
              >
                {m.role === "user" ? (
                  <span>{m.content}</span>
                ) : (
                  <RenderedMarkdown content={m.content} />
                )}
              </div>
            </div>
          ))}
          {streaming && messages[messages.length - 1]?.content === "" && (
            <div className="flex justify-start">
              <div className="rounded-xl px-3 py-2" style={{ backgroundColor: "var(--bg-surface)" }}>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre sua identidade..."
            disabled={streaming}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-[border-color,box-shadow] duration-200 focus:border-zinc-600 focus:shadow-[0_0_0_3px_rgba(113,113,122,0.1)] disabled:opacity-50"
            style={{ backgroundColor: "var(--bg-surface)", minHeight: "36px", maxHeight: "120px" }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
            }}
          />
          <button
            onClick={send}
            disabled={streaming || !input.trim()}
            className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-medium text-black transition-colors duration-150 hover:bg-zinc-200 disabled:opacity-30"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
