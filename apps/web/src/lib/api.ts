const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ─── MCP ────────────────────────────────────────────────────────

export const mcp = {
  status: () => request<{ connected: boolean; reason?: string }>("/mcp/status"),
  connectClaudeCode: () =>
    request<{ ok: boolean; message?: string; error?: string; manual?: unknown }>(
      "/mcp/connect-claude-code",
      { method: "POST" },
    ),
};
