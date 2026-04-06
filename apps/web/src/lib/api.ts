const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ─── Chat (SSE) ─────────────────────────────────────────────────

export interface ChatEvent {
  type: "start" | "chunk" | "tool_use" | "done" | "error";
  text?: string;
  conversationId?: string;
  name?: string;
  input?: unknown;
  message?: string;
}

export function streamChat(
  message: string,
  conversationId?: string,
  projectId?: string,
  onEvent?: (event: ChatEvent) => void,
): AbortController {
  const controller = new AbortController();

  fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, conversationId, projectId }),
    signal: controller.signal,
  }).then(async (res) => {
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
            const event = JSON.parse(line.slice(6)) as ChatEvent;
            onEvent?.(event);
          } catch {
            // skip malformed events
          }
        }
      }
    }
  });

  return controller;
}

// ─── Conversations ──────────────────────────────────────────────

export interface Conversation {
  id: string;
  project_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export const conversations = {
  list: () => request<Conversation[]>("/conversations"),
  messages: (id: string) => request<Message[]>(`/conversations/${id}/messages`),
  delete: (id: string) => request(`/conversations/${id}`, { method: "DELETE" }),
};

// ─── Memories ───────────────────────────────────────────────────

export interface Memory {
  id: string;
  content: string;
  category: string;
  importance: number;
  last_accessed: string;
  created_at: string;
  updated_at: string;
}

export const memories = {
  list: () => request<Memory[]>("/memories"),
  create: (data: { content: string; category?: string; importance?: number }) =>
    request<Memory>("/memories", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Memory>) =>
    request(`/memories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request(`/memories/${id}`, { method: "DELETE" }),
};

// ─── CLAUDE.md ──────────────────────────────────────────────────

export interface ClaudeMdSection {
  title: string;
  level: number;
  content: string;
  startLine: number;
  endLine: number;
}

export interface ClaudeMdFile {
  scope: "global" | "project";
  path: string;
  content: string;
  exists: boolean;
  sections: ClaudeMdSection[];
}

export const claudeMd = {
  list: () => request<ClaudeMdFile[]>("/claude-md"),
  raw: (scope: "global" | "project") =>
    request<{ exists: boolean; content: string; path: string }>(
      `/claude-md/raw?scope=${scope}`,
    ),
  update: (scope: "global" | "project", content: string) =>
    request("/claude-md", {
      method: "PUT",
      body: JSON.stringify({ scope, content }),
    }),
};

// ─── Projects ───────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const projects = {
  list: () => request<Project[]>("/projects"),
  get: (id: string) => request<Project>(`/projects/${id}`),
  create: (data: { name: string; description?: string }) =>
    request<Project>("/projects", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Project>) =>
    request(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request(`/projects/${id}`, { method: "DELETE" }),
};

// ─── MCP ────────────────────────────────────────────────────────

export const mcp = {
  status: () => request<{ connected: boolean; reason?: string }>("/mcp/status"),
  connectClaudeCode: () =>
    request<{ ok: boolean; message?: string; error?: string; manual?: unknown }>(
      "/mcp/connect-claude-code",
      { method: "POST" },
    ),
};

// ─── Health ─────────────────────────────────────────────────────

export const health = {
  check: () => request<{ status: string; kairos: boolean }>("/health"),
};
