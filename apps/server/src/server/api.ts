import type { FastifyInstance } from "fastify";
import type Database from "better-sqlite3";
import { runAgent } from "../core/agent.js";
import { generateId } from "../core/utils.js";
import { registerMcpConnectRoute } from "./mcp-connect.js";
import { registerClaudeMdRoutes } from "./claude-md.js";
import { registerClaudeMemoryRoutes } from "./claude-memory.js";
import { registerPluginRoutes } from "./claude-plugins.js";
import {
  listMemories,
  addMemory,
  deleteMemory,
  updateMemory,
} from "../features/memory/index.js";
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  createTask,
  listTasks,
  updateTask,
  deleteTask,
  createNote,
  listNotes,
  deleteNote,
  addFile,
  listFiles,
  removeFile,
} from "../features/projects/index.js";
import { isKairosRunning } from "../features/kairos/index.js";

export function registerRoutes(app: FastifyInstance, db: Database.Database): void {
  // MCP connection routes
  registerMcpConnectRoute(app);
  registerClaudeMdRoutes(app);
  registerClaudeMemoryRoutes(app);
  registerPluginRoutes(app);

  // Health
  app.get("/api/health", async () => ({
    status: "ok",
    kairos: isKairosRunning(),
  }));

  // ─── Chat (SSE streaming) ──────────────────────────────────────

  app.post("/api/chat", async (request, reply) => {
    const { message, conversationId, projectId } = request.body as {
      message: string;
      conversationId?: string;
      projectId?: string;
    };

    const convId = conversationId || generateId();

    // Create conversation if new
    const existing = db
      .prepare("SELECT id FROM conversations WHERE id = ?")
      .get(convId);
    if (!existing) {
      db.prepare(
        "INSERT INTO conversations (id, project_id, title) VALUES (?, ?, ?)",
      ).run(convId, projectId || null, message.slice(0, 100));
    }

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    reply.raw.write(`data: ${JSON.stringify({ type: "start", conversationId: convId })}\n\n`);

    try {
      const fullResponse = await runAgent({
        db,
        conversationId: convId,
        userMessage: message,
        projectId,
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

  // ─── Conversations ─────────────────────────────────────────────

  app.get("/api/conversations", async () => {
    return db
      .prepare("SELECT * FROM conversations ORDER BY updated_at DESC")
      .all();
  });

  app.get("/api/conversations/:id/messages", async (request) => {
    const { id } = request.params as { id: string };
    return db
      .prepare(
        "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
      )
      .all(id);
  });

  app.delete("/api/conversations/:id", async (request) => {
    const { id } = request.params as { id: string };
    db.prepare("DELETE FROM conversations WHERE id = ?").run(id);
    return { ok: true };
  });

  // ─── Memories ──────────────────────────────────────────────────

  app.get("/api/memories", async () => listMemories(db));

  app.post("/api/memories", async (request) => {
    const { content, category, importance } = request.body as {
      content: string;
      category?: string;
      importance?: number;
    };
    return addMemory(db, content, category as any, importance);
  });

  app.put("/api/memories/:id", async (request) => {
    const { id } = request.params as { id: string };
    const updates = request.body as {
      content?: string;
      category?: string;
      importance?: number;
    };
    const ok = updateMemory(db, id, updates as any);
    return { ok };
  });

  app.delete("/api/memories/:id", async (request) => {
    const { id } = request.params as { id: string };
    return { ok: deleteMemory(db, id) };
  });

  // ─── Projects ──────────────────────────────────────────────────

  app.get("/api/projects", async () => listProjects(db));

  app.post("/api/projects", async (request) => {
    const { name, description } = request.body as {
      name: string;
      description?: string;
    };
    return createProject(db, name, description);
  });

  app.get("/api/projects/:id", async (request) => {
    const { id } = request.params as { id: string };
    const project = getProject(db, id);
    if (!project) {
      return { error: "Not found" };
    }
    return project;
  });

  app.put("/api/projects/:id", async (request) => {
    const { id } = request.params as { id: string };
    const updates = request.body as any;
    return { ok: updateProject(db, id, updates) };
  });

  app.delete("/api/projects/:id", async (request) => {
    const { id } = request.params as { id: string };
    return { ok: deleteProject(db, id) };
  });

  // ─── Tasks ─────────────────────────────────────────────────────

  app.get("/api/projects/:projectId/tasks", async (request) => {
    const { projectId } = request.params as { projectId: string };
    return listTasks(db, projectId);
  });

  app.post("/api/projects/:projectId/tasks", async (request) => {
    const { projectId } = request.params as { projectId: string };
    const { title, description, priority } = request.body as {
      title: string;
      description?: string;
      priority?: number;
    };
    return createTask(db, projectId, title, description, priority);
  });

  app.put("/api/tasks/:id", async (request) => {
    const { id } = request.params as { id: string };
    const updates = request.body as any;
    return { ok: updateTask(db, id, updates) };
  });

  app.delete("/api/tasks/:id", async (request) => {
    const { id } = request.params as { id: string };
    return { ok: deleteTask(db, id) };
  });

  // ─── Notes ─────────────────────────────────────────────────────

  app.get("/api/projects/:projectId/notes", async (request) => {
    const { projectId } = request.params as { projectId: string };
    return listNotes(db, projectId);
  });

  app.post("/api/projects/:projectId/notes", async (request) => {
    const { projectId } = request.params as { projectId: string };
    const { content } = request.body as { content: string };
    return createNote(db, projectId, content);
  });

  app.delete("/api/notes/:id", async (request) => {
    const { id } = request.params as { id: string };
    return { ok: deleteNote(db, id) };
  });

  // ─── Files ─────────────────────────────────────────────────────

  app.get("/api/projects/:projectId/files", async (request) => {
    const { projectId } = request.params as { projectId: string };
    return listFiles(db, projectId);
  });

  app.post("/api/projects/:projectId/files", async (request) => {
    const { projectId } = request.params as { projectId: string };
    const { path, description } = request.body as {
      path: string;
      description?: string;
    };
    return addFile(db, projectId, path, description);
  });

  app.delete("/api/files/:id", async (request) => {
    const { id } = request.params as { id: string };
    return { ok: removeFile(db, id) };
  });

  // ─── KAIROS status ────────────────────────────────────────────

  app.get("/api/kairos/status", async () => ({
    running: isKairosRunning(),
  }));

  app.get("/api/kairos/log", async () => {
    return db
      .prepare(
        "SELECT * FROM kairos_log ORDER BY created_at DESC LIMIT 50",
      )
      .all();
  });
}
