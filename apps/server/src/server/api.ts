import type { FastifyInstance } from "fastify";
import type Database from "better-sqlite3";
import { runAgent } from "../core/agent.js";
import { generateId } from "../core/utils.js";
import { registerMcpConnectRoute } from "./mcp-connect.js";
import { registerClaudeMdRoutes } from "./claude-md.js";
import { registerClaudeMemoryRoutes } from "./claude-memory.js";
import { registerPluginRoutes } from "./claude-plugins.js";

export function registerRoutes(app: FastifyInstance, db: Database.Database): void {
  registerMcpConnectRoute(app);
  registerClaudeMdRoutes(app);
  registerClaudeMemoryRoutes(app);
  registerPluginRoutes(app);

  // Health
  app.get("/api/health", async () => ({ status: "ok" }));

  // ─── Chat (SSE streaming) ──────────────────────────────────────

  app.post("/api/chat", async (request, reply) => {
    const { message, conversationId } = request.body as {
      message: string;
      conversationId?: string;
    };

    const convId = conversationId || generateId();

    const existing = db
      .prepare("SELECT id FROM conversations WHERE id = ?")
      .get(convId);
    if (!existing) {
      db.prepare(
        "INSERT INTO conversations (id, title) VALUES (?, ?)",
      ).run(convId, message.slice(0, 100));
    }

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    reply.raw.write(`data: ${JSON.stringify({ type: "start", conversationId: convId })}\n\n`);

    try {
      await runAgent({
        db,
        conversationId: convId,
        userMessage: message,
        onChunk: (text) => {
          reply.raw.write(`data: ${JSON.stringify({ type: "chunk", text })}\n\n`);
        },
        onToolUse: (name, input) => {
          reply.raw.write(
            `data: ${JSON.stringify({ type: "tool_use", name, input })}\n\n`,
          );
        },
      });

      reply.raw.write(
        `data: ${JSON.stringify({ type: "done", conversationId: convId })}\n\n`,
      );
    } catch (err: any) {
      reply.raw.write(
        `data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`,
      );
    }

    reply.raw.end();
  });
}
