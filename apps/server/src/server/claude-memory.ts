import type { FastifyInstance } from "fastify";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

interface MemoryFile {
  name: string;
  description: string;
  type: string;
  content: string;
  filePath: string;
  project: string;
}

interface ProjectMemory {
  project: string;
  projectPath: string;
  index: string; // MEMORY.md content
  memories: MemoryFile[];
}

function getProjectsDir(): string {
  return path.join(os.homedir(), ".claude", "projects");
}

function parseMemoryFile(filePath: string, project: string): MemoryFile | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");

    // Parse YAML frontmatter
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!fmMatch) {
      return {
        name: path.basename(filePath, ".md"),
        description: "",
        type: "other",
        content: raw.trim(),
        filePath,
        project,
      };
    }

    const frontmatter = fmMatch[1];
    const content = fmMatch[2].trim();

    const name = frontmatter.match(/name:\s*(.+)/)?.[1]?.trim() || path.basename(filePath, ".md");
    const description = frontmatter.match(/description:\s*(.+)/)?.[1]?.trim() || "";
    const type = frontmatter.match(/type:\s*(.+)/)?.[1]?.trim() || "other";

    return { name, description, type, content, filePath, project };
  } catch {
    return null;
  }
}

function projectLabel(dirName: string): string {
  // c--Users-maico-OneDrive-Desktop-founders → founders
  const parts = dirName.split("-");
  // Take last meaningful segment
  return parts[parts.length - 1] || dirName;
}

export function registerClaudeMemoryRoutes(app: FastifyInstance): void {
  // List all projects with memories
  app.get("/api/claude-memory", async () => {
    const projectsDir = getProjectsDir();
    if (!fs.existsSync(projectsDir)) return [];

    const results: ProjectMemory[] = [];

    const dirs = fs.readdirSync(projectsDir);
    for (const dir of dirs) {
      const memoryDir = path.join(projectsDir, dir, "memory");
      const indexPath = path.join(memoryDir, "MEMORY.md");

      if (!fs.existsSync(indexPath)) continue;

      const index = fs.readFileSync(indexPath, "utf-8");
      const memories: MemoryFile[] = [];

      const files = fs.readdirSync(memoryDir).filter(
        (f) => f.endsWith(".md") && f !== "MEMORY.md",
      );

      for (const file of files) {
        const memory = parseMemoryFile(path.join(memoryDir, file), dir);
        if (memory) memories.push(memory);
      }

      results.push({
        project: projectLabel(dir),
        projectPath: dir,
        index,
        memories,
      });
    }

    return results;
  });

  // Get a single memory file
  app.get("/api/claude-memory/:project/:file", async (request) => {
    const { project, file } = request.params as { project: string; file: string };
    const filePath = path.join(getProjectsDir(), project, "memory", file);

    if (!fs.existsSync(filePath)) {
      return { error: "Not found" };
    }

    return parseMemoryFile(filePath, project);
  });

  // Update a memory file
  app.put("/api/claude-memory/:project/:file", async (request) => {
    const { project, file } = request.params as { project: string; file: string };
    const { content } = request.body as { content: string };
    const filePath = path.join(getProjectsDir(), project, "memory", file);

    fs.writeFileSync(filePath, content, "utf-8");
    return { ok: true };
  });

  // Delete a memory file
  app.delete("/api/claude-memory/:project/:file", async (request) => {
    const { project, file } = request.params as { project: string; file: string };
    const filePath = path.join(getProjectsDir(), project, "memory", file);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { ok: true };
    }
    return { ok: false };
  });
}
