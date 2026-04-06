import Anthropic from "@anthropic-ai/sdk";
import type Database from "better-sqlite3";
import { addMemory } from "../memory/index.js";

const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DREAM_INTERVAL = 60 * 60 * 1000; // 1 hour

interface KairosState {
  heartbeatTimer: ReturnType<typeof setInterval> | null;
  dreamTimer: ReturnType<typeof setInterval> | null;
  running: boolean;
}

const state: KairosState = {
  heartbeatTimer: null,
  dreamTimer: null,
  running: false,
};

export function startKairos(db: Database.Database): void {
  if (state.running) return;
  state.running = true;

  logEvent(db, "kairos_start", null);

  // Heartbeat: periodic check for recent activity
  state.heartbeatTimer = setInterval(() => {
    heartbeat(db);
  }, HEARTBEAT_INTERVAL);

  // Dream cycle: deeper analysis of accumulated context
  state.dreamTimer = setInterval(() => {
    dreamCycle(db);
  }, DREAM_INTERVAL);

  console.log("KAIROS started — heartbeat every 5min, dream cycle every 1h");
}

export function stopKairos(db: Database.Database): void {
  if (!state.running) return;

  if (state.heartbeatTimer) clearInterval(state.heartbeatTimer);
  if (state.dreamTimer) clearInterval(state.dreamTimer);
  state.heartbeatTimer = null;
  state.dreamTimer = null;
  state.running = false;

  logEvent(db, "kairos_stop", null);
  console.log("KAIROS stopped");
}

export function isKairosRunning(): boolean {
  return state.running;
}

function heartbeat(db: Database.Database): void {
  // Check for recent conversations (last 5 minutes)
  const recent = db
    .prepare(
      `SELECT COUNT(*) as count FROM messages
       WHERE created_at > datetime('now', '-5 minutes')`,
    )
    .get() as { count: number };

  logEvent(db, "heartbeat", JSON.stringify({ recent_messages: recent.count }));
}

async function dreamCycle(db: Database.Database): Promise<void> {
  logEvent(db, "dream_start", null);

  try {
    // Gather recent unprocessed messages
    const lastDream = db
      .prepare(
        `SELECT created_at FROM kairos_log
         WHERE event_type = 'dream_complete'
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get() as { created_at: string } | undefined;

    const since = lastDream?.created_at || "2000-01-01";

    const recentMessages = db
      .prepare(
        `SELECT m.role, m.content, c.title as conversation_title
         FROM messages m
         JOIN conversations c ON c.id = m.conversation_id
         WHERE m.created_at > ?
         ORDER BY m.created_at ASC
         LIMIT 100`,
      )
      .all(since) as { role: string; content: string; conversation_title: string }[];

    if (recentMessages.length < 5) {
      logEvent(db, "dream_skip", "Not enough new messages");
      return;
    }

    // Ask Claude to extract learnings
    const client = new Anthropic();
    const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-5";

    const conversationSummary = recentMessages
      .map((m) => `[${m.role}] ${m.content.slice(0, 500)}`)
      .join("\n");

    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: `You are KAIROS, the background learning system for Ō. Your job is to analyze recent conversations and extract important facts about the user that should be remembered.

Output a JSON array of memories to save. Each memory should have:
- "content": what to remember (concise, factual)
- "category": one of "preference", "fact", "constraint", "project", "other"
- "importance": 1-10

Only extract genuinely new and useful information. If there's nothing new to learn, return an empty array [].
Return ONLY the JSON array, no other text.`,
      messages: [
        {
          role: "user",
          content: `Analyze these recent conversations and extract any new facts about the user:\n\n${conversationSummary}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const extracted = JSON.parse(text);

    if (Array.isArray(extracted)) {
      for (const item of extracted) {
        if (item.content) {
          addMemory(db, item.content, item.category || "other", item.importance || 5);
        }
      }
      logEvent(
        db,
        "dream_complete",
        JSON.stringify({ memories_extracted: extracted.length }),
      );
    }
  } catch (err: any) {
    logEvent(db, "dream_error", err.message);
  }
}

function logEvent(
  db: Database.Database,
  eventType: string,
  payload: string | null,
): void {
  db.prepare("INSERT INTO kairos_log (event_type, payload) VALUES (?, ?)").run(
    eventType,
    payload,
  );
}
