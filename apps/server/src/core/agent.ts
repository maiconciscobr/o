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
  onChunk?: (text: string) => void;
  onToolUse?: (name: string, input: unknown) => void;
}

export async function runAgent(options: AgentOptions): Promise<string> {
  const { db, conversationId, userMessage, onChunk, onToolUse } = options;

  const client = new Anthropic();
  const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-5";

  db.prepare(
    "INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)",
  ).run(generateId(), conversationId, "user", userMessage);

  const memoryContext = getMemoriesForContext(db);
  const systemPrompt = buildSystemPrompt(memoryContext);

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

    for (const block of finalMessage.content) {
      if (block.type === "tool_use") {
        toolUses.push({ id: block.id, name: block.name, input: block.input });
      }
    }

    if (currentText) {
      fullResponse += currentText;
    }

    if (toolUses.length === 0 || finalMessage.stop_reason === "end_turn") {
      break;
    }

    messages.push({ role: "assistant", content: finalMessage.content });

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

  if (fullResponse) {
    db.prepare(
      "INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)",
    ).run(generateId(), conversationId, "assistant", fullResponse);
  }

  db.prepare(
    "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?",
  ).run(conversationId);

  return fullResponse;
}

function buildSystemPrompt(memoryContext: string): string {
  return `You are Ō, an identity curation assistant. Your job is to help the user understand, organize, and improve their developer identity — the context that AI agents receive about them.

You have access to their real data: CLAUDE.md files (instructions for agents), memories (what Claude Code learned about them), and their plugin/MCP ecosystem.

## User memories (from Claude Code auto-memory)
${memoryContext || "Nenhuma memória encontrada ainda."}

## Guidelines
- Responda SEMPRE em português do Brasil (pt-BR).
- Seja conciso. Suas respostas aparecem num painel lateral estreito.
- Use parágrafos curtos, listas com bullet points, e negritos para destaques.
- NÃO use emojis nos headings. Evite blocos de código longos — prefira trechos curtos inline.
- Quando sugerir mudanças no CLAUDE.md, pergunte se o usuário quer que você aplique. Se sim, use edit_claude_md.
- Use read_claude_md e list_claude_memories para ler dados reais antes de responder — nunca invente.
- Quando sugerir algo concreto, mostre o texto exato a adicionar (curto, direto).
- Se o usuário pedir para aplicar, aplique silenciosamente e confirme em uma linha.`;
}
