import { useState, useCallback, useRef } from "react";
import { streamChat, type ChatEvent, type Message } from "../lib/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolUses?: { name: string; input: unknown }[];
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const send = useCallback(
    (text: string, projectId?: string) => {
      // Add user message
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setStreaming(true);

      // Placeholder for assistant response
      const assistantId = crypto.randomUUID();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        toolUses: [],
      };
      setMessages((prev) => [...prev, assistantMsg]);

      const controller = streamChat(
        text,
        conversationId ?? undefined,
        projectId,
        (event: ChatEvent) => {
          switch (event.type) {
            case "start":
              if (event.conversationId) {
                setConversationId(event.conversationId);
              }
              break;
            case "chunk":
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + (event.text || "") }
                    : m,
                ),
              );
              break;
            case "tool_use":
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        toolUses: [
                          ...(m.toolUses || []),
                          { name: event.name!, input: event.input },
                        ],
                      }
                    : m,
                ),
              );
              break;
            case "done":
              setStreaming(false);
              break;
            case "error":
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + `\n\n**Error:** ${event.message}` }
                    : m,
                ),
              );
              setStreaming(false);
              break;
          }
        },
      );

      controllerRef.current = controller;
    },
    [conversationId],
  );

  const stop = useCallback(() => {
    controllerRef.current?.abort();
    setStreaming(false);
  }, []);

  const loadConversation = useCallback(
    (id: string, history: Message[]) => {
      setConversationId(id);
      setMessages(
        history.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        })),
      );
    },
    [],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  return { messages, conversationId, streaming, send, stop, loadConversation, reset };
}
