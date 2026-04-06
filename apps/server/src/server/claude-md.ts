import type { FastifyInstance } from "fastify";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

interface ClaudeMdFile {
  scope: "global" | "project";
  path: string;
  content: string;
  exists: boolean;
  sections: Section[];
}

interface Section {
  title: string;
  level: number;
  content: string;
  startLine: number;
  endLine: number;
}

function parseSections(content: string): Section[] {
  const lines = content.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,3})\s+(.+)/);
    if (match) {
      if (current) {
        current.endLine = i - 1;
        current.content = current.content.trim();
        sections.push(current);
      }
      current = {
        title: match[2].trim(),
        level: match[1].length,
        content: "",
        startLine: i,
        endLine: i,
      };
    } else if (current) {
      current.content += lines[i] + "\n";
    }
  }

  if (current) {
    current.endLine = lines.length - 1;
    current.content = current.content.trim();
    sections.push(current);
  }

  return sections;
}

function getGlobalPath(): string {
  return path.join(os.homedir(), ".claude", "CLAUDE.md");
}

function readClaudeMd(filePath: string, scope: "global" | "project"): ClaudeMdFile {
  const exists = fs.existsSync(filePath);
  const content = exists ? fs.readFileSync(filePath, "utf-8") : "";
  return {
    scope,
    path: filePath,
    content,
    exists,
    sections: exists ? parseSections(content) : [],
  };
}

export function registerClaudeMdRoutes(app: FastifyInstance): void {
  // List both global and project CLAUDE.md
  app.get("/api/claude-md", async (request) => {
    const { projectDir } = request.query as { projectDir?: string };

    const files: ClaudeMdFile[] = [];

    // Global
    files.push(readClaudeMd(getGlobalPath(), "global"));

    // Project (if provided)
    if (projectDir) {
      const projectPath = path.join(projectDir, "CLAUDE.md");
      files.push(readClaudeMd(projectPath, "project"));
    }

    return files;
  });

  // Get raw content of a specific file
  app.get("/api/claude-md/raw", async (request) => {
    const { scope, projectDir } = request.query as {
      scope: "global" | "project";
      projectDir?: string;
    };

    const filePath =
      scope === "global"
        ? getGlobalPath()
        : path.join(projectDir || process.cwd(), "CLAUDE.md");

    if (!fs.existsSync(filePath)) {
      return { exists: false, content: "", path: filePath };
    }

    return {
      exists: true,
      content: fs.readFileSync(filePath, "utf-8"),
      path: filePath,
    };
  });

  // Update content
  app.put("/api/claude-md", async (request) => {
    const { scope, projectDir, content } = request.body as {
      scope: "global" | "project";
      projectDir?: string;
      content: string;
    };

    const filePath =
      scope === "global"
        ? getGlobalPath()
        : path.join(projectDir || process.cwd(), "CLAUDE.md");

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf-8");

    return { ok: true, path: filePath };
  });
}
