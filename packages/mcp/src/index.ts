#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { getDb } from "./db.js";

const db = getDb();

const server = new McpServer({
  name: "o-mcp",
  version: "0.1.0",
});

// ─── Tool: get_developer_context ────────────────────────────────

server.tool(
  "get_developer_context",
  "Returns what Ō knows about the developer — memories ordered by importance. Call this at the start of a session to understand who you're working with.",
  {},
  async () => {
    const memories = db
      .prepare(
        "SELECT content, category, importance FROM memories ORDER BY importance DESC, last_accessed DESC LIMIT 50",
      )
      .all() as { content: string; category: string; importance: number }[];

    // Update last_accessed
    if (memories.length > 0) {
      db.prepare("UPDATE memories SET last_accessed = datetime('now')").run();
    }

    if (memories.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No developer context available yet. Ō hasn't learned anything about this user. Start a conversation in the Ō interface to build context.",
          },
        ],
      };
    }

    const grouped: Record<string, string[]> = {};
    for (const m of memories) {
      const cat = m.category || "other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(`[${m.importance}/10] ${m.content}`);
    }

    let text = "# Developer Context (from Ō)\n";
    const categoryLabels: Record<string, string> = {
      preference: "Preferences",
      fact: "Facts",
      constraint: "Constraints",
      project: "Project context",
      other: "Other",
    };

    for (const [category, items] of Object.entries(grouped)) {
      text += `\n## ${categoryLabels[category] || category}\n`;
      for (const item of items) {
        text += `- ${item}\n`;
      }
    }

    return { content: [{ type: "text" as const, text }] };
  },
);

// ─── Tool: get_active_project ───────────────────────────────────

server.tool(
  "get_active_project",
  "Returns the currently active project (updated in last 24h), its open tasks, and associated files. Returns empty if no project is active.",
  {},
  async () => {
    const project = db
      .prepare(
        `SELECT id, name, description, status
         FROM projects
         WHERE status = 'active'
           AND updated_at > datetime('now', '-24 hours')
         ORDER BY updated_at DESC
         LIMIT 1`,
      )
      .get() as
      | { id: string; name: string; description: string; status: string }
      | undefined;

    if (!project) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No active project. No project has been updated in the last 24 hours.",
          },
        ],
      };
    }

    const tasks = db
      .prepare(
        `SELECT title, status, priority
         FROM tasks
         WHERE project_id = ? AND status IN ('todo', 'doing')
         ORDER BY priority DESC, created_at ASC`,
      )
      .all(project.id) as {
      title: string;
      status: string;
      priority: number;
    }[];

    const files = db
      .prepare(
        "SELECT path, description FROM files WHERE project_id = ? ORDER BY created_at DESC",
      )
      .all(project.id) as { path: string; description: string }[];

    let text = `# Active Project: ${project.name}\n`;
    if (project.description) text += `${project.description}\n`;

    if (tasks.length > 0) {
      text += "\n## Open Tasks\n";
      for (const t of tasks) {
        const icon = t.status === "doing" ? "🔧" : "☐";
        text += `- ${icon} [${t.status}] ${t.title}\n`;
      }
    } else {
      text += "\nNo open tasks.\n";
    }

    if (files.length > 0) {
      text += "\n## Project Files\n";
      for (const f of files) {
        text += `- \`${f.path}\`${f.description ? ` — ${f.description}` : ""}\n`;
      }
    }

    return { content: [{ type: "text" as const, text }] };
  },
);

// ─── Tool: add_memory ───────────────────────────────────────────

server.tool(
  "add_memory",
  "Save something important about the developer for future sessions. Use this when you learn preferences, constraints, facts about their stack, or project-specific context worth remembering.",
  {
    content: z.string().describe("What to remember about the developer"),
    category: z
      .enum(["project", "preference", "fact", "constraint", "other"])
      .default("other")
      .describe("Category of the memory"),
    importance: z
      .number()
      .min(1)
      .max(10)
      .default(5)
      .describe("Importance from 1 (low) to 10 (critical)"),
  },
  async ({ content, category, importance }) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);

    db.prepare(
      `INSERT INTO memories (id, content, category, importance, last_accessed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, content, category, Math.min(10, Math.max(1, importance)), now, now, now);

    return {
      content: [
        {
          type: "text" as const,
          text: `Memory saved: "${content}" (${category}, importance: ${importance}/10)`,
        },
      ],
    };
  },
);

// ─── Start ──────────────────────────────────────────────────────

const mode = process.argv.includes("--http") ? "http" : "stdio";

if (mode === "stdio") {
  const transport = new StdioServerTransport();
  await server.connect(transport);
} else {
  // HTTP mode with SSE for development
  const http = await import("node:http");
  const url = await import("node:url");

  const PORT = Number(process.env.MCP_PORT) || 3132;
  const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;

  let sseTransport: SSEServerTransport | null = null;

  const httpServer = http.createServer(async (req, res) => {
    // Auth check
    if (MCP_AUTH_TOKEN) {
      const auth = req.headers.authorization;
      if (!auth || auth !== `Bearer ${MCP_AUTH_TOKEN}`) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }
    }

    const parsedUrl = url.parse(req.url || "", true);

    if (parsedUrl.pathname === "/sse" && req.method === "GET") {
      sseTransport = new SSEServerTransport("/messages", res);
      await server.connect(sseTransport);
    } else if (parsedUrl.pathname === "/messages" && req.method === "POST") {
      if (!sseTransport) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "No SSE connection" }));
        return;
      }
      await sseTransport.handlePostMessage(req, res);
    } else if (parsedUrl.pathname === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "o-mcp" }));
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  httpServer.listen(PORT, "127.0.0.1", () => {
    console.log(`Ō MCP server (HTTP/SSE) listening on http://127.0.0.1:${PORT}`);
    console.log("  SSE endpoint: /sse");
    console.log("  Messages endpoint: /messages");
  });
}
