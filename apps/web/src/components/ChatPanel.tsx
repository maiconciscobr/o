import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { marked } from "marked";

marked.setOptions({ breaks: true, gfm: true });

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolUses?: { name: string; input?: any }[];
  timestamp: number;
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

const TOOL_LABELS: Record<string, { label: string; icon: string }> = {
  read_claude_md: { label: "Lendo CLAUDE.md", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" },
  edit_claude_md: { label: "Editando CLAUDE.md", icon: "M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z" },
  list_claude_memories: { label: "Listando memórias", icon: "M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" },
  read_claude_memory: { label: "Lendo memória", icon: "M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" },
  file_read: { label: "Lendo arquivo", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" },
  add_memory: { label: "Salvando memória", icon: "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" },
};

function ToolIndicator({ name }: { name: string }) {
  const tool = TOOL_LABELS[name] || { label: name, icon: "M13 10V3L4 14h7v7l9-11h-7z" };

  return (
    <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-400 thinking-bar" style={{ backgroundColor: "oklch(0.15 0.008 260)" }}>
      <svg className="h-3 w-3 shrink-0 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d={tool.icon} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{tool.label}...</span>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 animate-msg-in">
      <div className="rounded-xl px-3.5 py-2.5" style={{ backgroundColor: "var(--bg-surface)" }}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{
                  backgroundColor: "oklch(0.6 0.08 250)",
                  animationDelay: `${i * 150}ms`,
                }}
              />
            ))}
          </div>
          <span className="text-[11px] text-zinc-500">Pensando...</span>
        </div>
      </div>
    </div>
  );
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "agora";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
  return `${Math.floor(diff / 3600000)}h`;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Smart auto-scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 80);
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom, activeTools]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text, timestamp: Date.now() };
    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", toolUses: [], timestamp: Date.now() };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);
    setActiveTools([]);

    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = "36px";

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
              } else if (event.type === "tool_use") {
                setActiveTools((prev) => [...prev, event.name]);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, toolUses: [...(m.toolUses || []), { name: event.name, input: event.input }] }
                      : m,
                  ),
                );
                // Remove after 2s
                setTimeout(() => {
                  setActiveTools((prev) => prev.filter((_, i) => i !== 0));
                }, 2000);
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
      setActiveTools([]);
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
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-zinc-500 animate-[fade-in-up_400ms_ease-out_both]">
              Me pergunte sobre suas memórias,
              <br />
              CLAUDE.md ou plugins.
            </p>
            <div className="mt-4 space-y-2 w-full">
              {[
                "O que meu CLAUDE.md pode melhorar?",
                "Resume minhas memórias",
                "Quais plugins eu deveria desativar?",
              ].map((suggestion, i) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="block w-full rounded-lg border border-zinc-800 px-3 py-2.5 text-left text-xs text-zinc-400 transition-all duration-200 hover:border-zinc-600 hover:text-zinc-200 hover:-translate-y-0.5"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    animation: `suggestion-in 0.3s ease-out ${150 + i * 80}ms both`,
                  }}
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
              className={`group animate-msg-in flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[90%]">
                {/* Tool indicators */}
                {m.role === "assistant" && m.toolUses && m.toolUses.length > 0 && (
                  <div className="mb-1.5 space-y-1">
                    {m.toolUses.map((t, i) => (
                      <ToolIndicator key={i} name={t.name} />
                    ))}
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`rounded-xl px-3.5 py-2.5 text-sm ${
                    m.role === "user"
                      ? "border border-zinc-700 text-zinc-100"
                      : "text-zinc-200"
                  }`}
                  style={{ backgroundColor: m.role === "user" ? "oklch(0.20 0.008 260)" : "var(--bg-surface)" }}
                >
                  {m.role === "user" ? (
                    <span>{m.content}</span>
                  ) : (
                    <>
                      <RenderedMarkdown content={m.content} />
                      {/* Blinking cursor while streaming */}
                      {streaming && m === messages[messages.length - 1] && m.content && (
                        <span
                          className="inline-block w-0.5 h-4 ml-0.5 align-text-bottom animate-blink rounded-full"
                          style={{ backgroundColor: "oklch(0.6 0.08 250)" }}
                        />
                      )}
                    </>
                  )}
                </div>

                {/* Timestamp on hover */}
                <span className="mt-0.5 block text-[10px] text-zinc-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100 h-0 group-hover:h-auto">
                  {timeAgo(m.timestamp)}
                </span>
              </div>
            </div>
          ))}

          {/* Active tool indicators during streaming */}
          {streaming && activeTools.length > 0 && (
            <div className="space-y-1 animate-msg-in">
              {activeTools.map((name, i) => (
                <ToolIndicator key={i} name={name} />
              ))}
            </div>
          )}

          {/* Thinking indicator */}
          {streaming && messages[messages.length - 1]?.content === "" && activeTools.length === 0 && (
            <ThinkingIndicator />
          )}
        </div>
        <div ref={bottomRef} />

        {/* Scroll to bottom button */}
        {!isAtBottom && (
          <button
            onClick={scrollToBottom}
            className="sticky bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-zinc-700 px-3 py-1 text-[10px] text-zinc-400 shadow-lg transition-all duration-200 hover:border-zinc-500 hover:text-zinc-200 animate-[fade-in-up_200ms_ease-out_both]"
            style={{ backgroundColor: "var(--bg-surface)" }}
          >
            ↓ Novas mensagens
          </button>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={streaming ? "Aguarde a resposta..." : "Pergunte sobre sua identidade..."}
            disabled={streaming}
            rows={1}
            className="flex-1 resize-none overflow-hidden rounded-lg border border-zinc-800 px-3 py-2 text-sm leading-5 text-zinc-100 placeholder-zinc-600 outline-none transition-[border-color,box-shadow] duration-200 focus:border-zinc-600 focus:shadow-[0_0_0_3px_rgba(113,113,122,0.1)] disabled:opacity-40"
            style={{ backgroundColor: "var(--bg-surface)", height: "36px", maxHeight: "120px" }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "36px";
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
              t.style.overflow = t.scrollHeight > 120 ? "auto" : "hidden";
            }}
          />
          <button
            onClick={send}
            disabled={streaming || !input.trim()}
            className="btn-send flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-20"
            style={{
              backgroundColor: input.trim() && !streaming ? "oklch(0.85 0.005 260)" : "oklch(0.3 0.005 260)",
              color: input.trim() && !streaming ? "oklch(0.13 0.005 260)" : "oklch(0.5 0.005 260)",
            }}
          >
            {streaming ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
