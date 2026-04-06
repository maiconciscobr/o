import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

/**
 * MCP server connects to the same SQLite database as the main Ō server.
 * It looks for the database in order:
 * 1. O_DB_PATH env var (explicit path)
 * 2. ./data/o.db (relative to cwd — when running from project root)
 * 3. ../../../data/o.db (when running from packages/mcp/)
 */
export function getDb(): Database.Database {
  const candidates = [
    process.env.O_DB_PATH,
    path.resolve(process.cwd(), "data", "o.db"),
    path.resolve(process.cwd(), "..", "..", "data", "o.db"),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const db = new Database(candidate, { readonly: false });
      db.pragma("journal_mode = WAL");
      db.pragma("foreign_keys = ON");
      return db;
    }
  }

  // If no existing DB found, create one at the default location
  const defaultPath = path.resolve(process.cwd(), "data", "o.db");
  fs.mkdirSync(path.dirname(defaultPath), { recursive: true });
  const db = new Database(defaultPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Run minimal schema so the MCP server can work standalone
  db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      importance INTEGER NOT NULL DEFAULT 5,
      last_accessed TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'todo',
      priority INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}
