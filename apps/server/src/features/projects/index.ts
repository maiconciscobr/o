import type Database from "better-sqlite3";
import { generateId } from "../../core/utils.js";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function createProject(
  db: Database.Database,
  name: string,
  description?: string,
): Project {
  const id = generateId();
  db.prepare(
    "INSERT INTO projects (id, name, description) VALUES (?, ?, ?)",
  ).run(id, name, description || null);
  return db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as Project;
}

export function listProjects(db: Database.Database): Project[] {
  return db
    .prepare("SELECT * FROM projects ORDER BY updated_at DESC")
    .all() as Project[];
}

export function getProject(
  db: Database.Database,
  id: string,
): Project | undefined {
  return db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(id) as Project | undefined;
}

export function updateProject(
  db: Database.Database,
  id: string,
  updates: Partial<Pick<Project, "name" | "description" | "status">>,
): boolean {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) { fields.push("name = ?"); values.push(updates.name); }
  if (updates.description !== undefined) { fields.push("description = ?"); values.push(updates.description); }
  if (updates.status !== undefined) { fields.push("status = ?"); values.push(updates.status); }

  if (fields.length === 0) return false;
  fields.push("updated_at = datetime('now')");
  values.push(id);

  const result = db.prepare(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

export function deleteProject(db: Database.Database, id: string): boolean {
  const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  return result.changes > 0;
}

// Tasks within projects
export function createTask(
  db: Database.Database,
  projectId: string,
  title: string,
  description?: string,
  priority?: number,
) {
  const id = generateId();
  db.prepare(
    "INSERT INTO tasks (id, project_id, title, description, priority) VALUES (?, ?, ?, ?, ?)",
  ).run(id, projectId, title, description || null, priority || 0);
  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
}

export function listTasks(db: Database.Database, projectId: string) {
  return db
    .prepare("SELECT * FROM tasks WHERE project_id = ? ORDER BY priority DESC, created_at ASC")
    .all(projectId);
}

export function updateTask(
  db: Database.Database,
  id: string,
  updates: { title?: string; description?: string; status?: string; priority?: number },
): boolean {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.title !== undefined) { fields.push("title = ?"); values.push(updates.title); }
  if (updates.description !== undefined) { fields.push("description = ?"); values.push(updates.description); }
  if (updates.status !== undefined) { fields.push("status = ?"); values.push(updates.status); }
  if (updates.priority !== undefined) { fields.push("priority = ?"); values.push(updates.priority); }

  if (fields.length === 0) return false;
  fields.push("updated_at = datetime('now')");
  values.push(id);

  const result = db.prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

export function deleteTask(db: Database.Database, id: string): boolean {
  return db.prepare("DELETE FROM tasks WHERE id = ?").run(id).changes > 0;
}

// Notes within projects
export function createNote(db: Database.Database, projectId: string, content: string) {
  const id = generateId();
  db.prepare("INSERT INTO notes (id, project_id, content) VALUES (?, ?, ?)").run(id, projectId, content);
  return db.prepare("SELECT * FROM notes WHERE id = ?").get(id);
}

export function listNotes(db: Database.Database, projectId: string) {
  return db.prepare("SELECT * FROM notes WHERE project_id = ? ORDER BY created_at DESC").all(projectId);
}

export function deleteNote(db: Database.Database, id: string): boolean {
  return db.prepare("DELETE FROM notes WHERE id = ?").run(id).changes > 0;
}

// Files within projects
export function addFile(db: Database.Database, projectId: string, filePath: string, description?: string) {
  const id = generateId();
  db.prepare("INSERT INTO files (id, project_id, path, description) VALUES (?, ?, ?, ?)").run(
    id, projectId, filePath, description || null,
  );
  return db.prepare("SELECT * FROM files WHERE id = ?").get(id);
}

export function listFiles(db: Database.Database, projectId: string) {
  return db.prepare("SELECT * FROM files WHERE project_id = ? ORDER BY created_at DESC").all(projectId);
}

export function removeFile(db: Database.Database, id: string): boolean {
  return db.prepare("DELETE FROM files WHERE id = ?").run(id).changes > 0;
}
