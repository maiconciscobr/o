import Anthropic from "@anthropic-ai/sdk";
import type Database from "better-sqlite3";
import { generateId } from "./utils.js";
import { getTools, executeTool } from "../features/tools/index.js";
import { getMemoriesForContext } from "../features/memory/index.js";

const MAX_TURNS = 20;

interface AgentOptions {
  db: Database.Database;
  conversationId: string;
  userMessage: string;
  projectId?: string;
  onChunk?: (text: string) => void;
  onToolUse?: (name: string, input: unknown) => void;
}

export async function runAgent(options: AgentOptions): Promise<string> {
  const { db, conversationId, userMessage, projectId, onChunk, onToolUse } =
    options;

  const client = new Anthropic();
  const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-5";

  // Save user message
  db.prepare(
    "INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)",
  ).run(generateId(), conversationId, "user", userMessage);

  // Build context from memories
  const memoryContext = getMemoriesForContext(db);

  const systemPrompt = buildSystemPrompt(memoryContext, projectId ? getProjectContext(db, projectId) : null);

  // Load conversation history
  const history = db
    .prepare(
      "SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
    )
    .all(conversationId) as { role: string; content: string }[];

  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const tools = getTools();

  let fullResponse = "";
  let turns = 0;

  while (turns < MAX_TURNS) {
    turns++;

    const stream = await client.messages.stream({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages,
      tools,
    });

    let currentText = "";
    const toolUses: Array<{ id: string; name: string; input: unknown }> = [];

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        currentText += event.delta.text;
        onChunk?.(event.delta.text);
      }
    }

    const finalMessage = await stream.finalMessage();

    // Collect tool uses from the final message
    for (const block of finalMessage.content) {
      if (block.type === "tool_use") {
        toolUses.push({ id: block.id, name: block.name, input: block.input });
      }
    }

    if (currentText) {
      fullResponse += currentText;
    }

    // If no tool use, we're done
    if (toolUses.length === 0 || finalMessage.stop_reason === "end_turn") {
      break;
    }

    // Add assistant message with all content blocks
    messages.push({ role: "assistant", content: finalMessage.content });

    // Execute tools and add results
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tool of toolUses) {
      onToolUse?.(tool.name, tool.input);
      const result = await executeTool(db, tool.name, tool.input);
      toolResults.push({
        type: "tool_result",
        tool_use_id: tool.id,
        content: typeof result === "string" ? result : JSON.stringify(result),
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  // Save assistant response
  if (fullResponse) {
    db.prepare(
      "INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)",
    ).run(generateId(), conversationId, "assistant", fullResponse);
  }

  // Update conversation timestamp
  db.prepare(
    "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?",
  ).run(conversationId);

  return fullResponse;
}

function buildSystemPrompt(
  memoryContext: string,
  projectContext: string | null,
): string {
  let prompt = `You are Ō, a personal AI assistant that knows its user deeply. You have persistent memory across sessions.

## What you know about this user
${memoryContext || "No memories yet. Learn about the user through conversation."}`;

  if (projectContext) {
    prompt += `\n\n## Active project\n${projectContext}`;
  }

  prompt += `\n\n## Guidelines
- Be direct and helpful. No fluff.
- When you learn something important about the user (preferences, constraints, stack, facts), use the add_memory tool to save it.
- You have access to dev tools (file operations, bash) — use them when asked.
- Keep responses concise unless the user asks for detail.`;

  return prompt;
}

function getProjectContext(db: Database.Database, projectId: string): string {
  const project = db
    .prepare("SELECT name, description FROM projects WHERE id = ?")
    .get(projectId) as { name: string; description: string } | undefined;

  if (!project) return "";

  const tasks = db
    .prepare(
      "SELECT title, status FROM tasks WHERE project_id = ? AND status IN ('todo', 'doing') ORDER BY priority DESC LIMIT 10",
    )
    .all(projectId) as { title: string; status: string }[];

  let ctx = `**${project.name}**`;
  if (project.description) ctx += ` — ${project.description}`;

  if (tasks.length > 0) {
    ctx += "\n\nOpen tasks:";
    for (const t of tasks) {
      ctx += `\n- [${t.status}] ${t.title}`;
    }
  }

  return ctx;
}
