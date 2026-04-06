import type Database from "better-sqlite3";
import { generateId, now } from "../../core/utils.js";

export type MemoryCategory =
  | "project"
  | "preference"
  | "fact"
  | "constraint"
  | "other";

export interface Memory {
  id: string;
  content: string;
  category: MemoryCategory;
  importance: number;
  last_accessed: string;
  created_at: string;
  updated_at: string;
}

export function getMemoriesForContext(db: Database.Database): string {
  const memories = db
    .prepare(
      "SELECT content, category, importance FROM memories ORDER BY importance DESC, last_accessed DESC LIMIT 50",
    )
    .all() as Pick<Memory, "content" | "category" | "importance">[];

  if (memories.length === 0) return "";

  // Update last_accessed for retrieved memories
  db.prepare("UPDATE memories SET last_accessed = datetime('now')").run();

  const grouped: Record<string, string[]> = {};
  for (const m of memories) {
    const cat = m.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(`[${m.importance}/10] ${m.content}`);
  }

  let text = "";
  for (const [category, items] of Object.entries(grouped)) {
    text += `\n### ${category}\n`;
    for (const item of items) {
      text += `- ${item}\n`;
    }
  }

  return text.trim();
}

export function addMemory(
  db: Database.Database,
  content: string,
  category: MemoryCategory = "other",
  importance: number = 5,
): Memory {
  const id = generateId();
  const timestamp = now();
  db.prepare(
    `INSERT INTO memories (id, content, category, importance, last_accessed, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, content, category, Math.min(10, Math.max(1, importance)), timestamp, timestamp, timestamp);

  return { id, content, category, importance, last_accessed: timestamp, created_at: timestamp, updated_at: timestamp };
}

export function listMemories(db: Database.Database): Memory[] {
  return db
    .prepare("SELECT * FROM memories ORDER BY importance DESC, updated_at DESC")
    .all() as Memory[];
}

export function deleteMemory(db: Database.Database, id: string): boolean {
  const result = db.prepare("DELETE FROM memories WHERE id = ?").run(id);
  return result.changes > 0;
}

export function updateMemory(
  db: Database.Database,
  id: string,
  updates: Partial<Pick<Memory, "content" | "category" | "importance">>,
): boolean {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.content !== undefined) {
    fields.push("content = ?");
    values.push(updates.content);
  }
  if (updates.category !== undefined) {
    fields.push("category = ?");
    values.push(updates.category);
  }
  if (updates.importance !== undefined) {
    fields.push("importance = ?");
    values.push(Math.min(10, Math.max(1, updates.importance)));
  }

  if (fields.length === 0) return false;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  const result = db
    .prepare(`UPDATE memories SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);
  return result.changes > 0;
}
