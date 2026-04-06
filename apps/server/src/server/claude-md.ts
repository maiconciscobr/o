import type { FastifyInstance } from "fastify";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

interface Section {
  title: string;
  level: number;
  content: string;
}

interface ClaudeMdEntry {
  label: string;
  filePath: string;
  content: string;
  sections: Section[];
}

function parseSections(content: string): Section[] {
  const lines = content.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,3})\s+(.+)/);
    if (match) {
      if (current) {
        current.content = current.content.trim();
        sections.push(current);
      }
      current = { title: match[2].trim(), level: match[1].length, content: "" };
    } else if (current) {
      current.content += lines[i] + "\n";
    }
  }

  if (current) {
    current.content = current.content.trim();
    sections.push(current);
  }

  return sections;
}

function findClaudeMdFiles(): ClaudeMdEntry[] {
  const entries: ClaudeMdEntry[] = [];

  // 1. Global ~/.claude/CLAUDE.md
  const globalPath = path.join(os.homedir(), ".claude", "CLAUDE.md");
  if (fs.existsSync(globalPath)) {
    const content = fs.readFileSync(globalPath, "utf-8");
    entries.push({
      label: "Global",
      filePath: globalPath,
      content,
      sections: parseSections(content),
    });
  }

  // 2. Scan common project directories for CLAUDE.md files
  const scanDirs = [
    path.join(os.homedir(), "OneDrive", "Desktop"),
    path.join(os.homedir(), "Desktop"),
    path.join(os.homedir(), "Projects"),
    path.join(os.homedir(), "repos"),
    path.join(os.homedir(), "code"),
  ];

  for (const dir of scanDirs) {
    if (!fs.existsSync(dir)) continue;

    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (!item.isDirectory()) continue;
        const claudeMdPath = path.join(dir, item.name, "CLAUDE.md");
        if (fs.existsSync(claudeMdPath)) {
          const content = fs.readFileSync(claudeMdPath, "utf-8");
          entries.push({
            label: item.name,
            filePath: claudeMdPath,
            content,
            sections: parseSections(content),
          });
        }
      }
    } catch {
      // permission errors, skip
    }
  }

  return entries;
}

export function registerClaudeMdRoutes(app: FastifyInstance): void {
  app.get("/api/claude-md", async () => {
    return findClaudeMdFiles();
  });

  app.get("/api/claude-md/raw", async (request) => {
    const { path: filePath } = request.query as { path: string };
    if (!filePath || !fs.existsSync(filePath)) {
      return { exists: false, content: "", path: filePath };
    }
    return {
      exists: true,
      content: fs.readFileSync(filePath, "utf-8"),
      path: filePath,
    };
  });

  app.put("/api/claude-md", async (request) => {
    const { path: filePath, content } = request.body as {
      path: string;
      content: string;
    };
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf-8");
    return { ok: true, path: filePath };
  });
}
