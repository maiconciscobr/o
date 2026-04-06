import type Anthropic from "@anthropic-ai/sdk";
import type Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { addMemory } from "../memory/index.js";

export function getTools(): Anthropic.Tool[] {
  return [
    {
      name: "add_memory",
      description:
        "Save something important about the user (preference, constraint, fact, project info). Use this whenever you learn something worth remembering across sessions.",
      input_schema: {
        type: "object" as const,
        properties: {
          content: {
            type: "string",
            description: "What to remember",
          },
          category: {
            type: "string",
            enum: ["project", "preference", "fact", "constraint", "other"],
            description: "Category of the memory",
          },
          importance: {
            type: "number",
            description: "Importance from 1 (low) to 10 (critical)",
          },
        },
        required: ["content"],
      },
    },
    {
      name: "file_read",
      description: "Read the contents of a file",
      input_schema: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "Absolute or relative file path" },
        },
        required: ["path"],
      },
    },
    {
      name: "file_write",
      description: "Write content to a file (creates directories if needed)",
      input_schema: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "File path" },
          content: { type: "string", description: "Content to write" },
        },
        required: ["path", "content"],
      },
    },
    {
      name: "file_search",
      description: "Search for files matching a glob pattern",
      input_schema: {
        type: "object" as const,
        properties: {
          pattern: { type: "string", description: "Glob pattern (e.g. **/*.ts)" },
          directory: { type: "string", description: "Directory to search in" },
        },
        required: ["pattern"],
      },
    },
    {
      name: "bash_execute",
      description: "Execute a shell command and return its output",
      input_schema: {
        type: "object" as const,
        properties: {
          command: { type: "string", description: "Shell command to execute" },
          cwd: { type: "string", description: "Working directory" },
        },
        required: ["command"],
      },
    },
    {
      name: "read_claude_md",
      description: "Read the global CLAUDE.md (~/.claude/CLAUDE.md) or a project-specific one. Returns the full content.",
      input_schema: {
        type: "object" as const,
        properties: {
          scope: { type: "string", enum: ["global"], description: "Which CLAUDE.md to read" },
          projectPath: { type: "string", description: "Full path to project directory (for project scope)" },
        },
        required: [],
      },
    },
    {
      name: "edit_claude_md",
      description: "Replace the entire content of a CLAUDE.md file. Use read_claude_md first to get the current content, then send the full updated content.",
      input_schema: {
        type: "object" as const,
        properties: {
          scope: { type: "string", enum: ["global"], description: "Which CLAUDE.md to edit" },
          projectPath: { type: "string", description: "Full path to project directory (for project scope)" },
          content: { type: "string", description: "The new full content of the CLAUDE.md file" },
        },
        required: ["content"],
      },
    },
    {
      name: "list_claude_memories",
      description: "List all Claude Code auto-memories from ~/.claude/projects/. Returns memory names, types, and descriptions grouped by project.",
      input_schema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "read_claude_memory",
      description: "Read the full content of a specific Claude Code memory file.",
      input_schema: {
        type: "object" as const,
        properties: {
          projectPath: { type: "string", description: "Project directory name inside ~/.claude/projects/" },
          fileName: { type: "string", description: "Memory file name (e.g. user_role.md)" },
        },
        required: ["projectPath", "fileName"],
      },
    },
  ];
}

export async function executeTool(
  db: Database.Database,
  name: string,
  input: unknown,
): Promise<string> {
  const params = input as Record<string, any>;

  switch (name) {
    case "add_memory": {
      const memory = addMemory(
        db,
        params.content,
        params.category || "other",
        params.importance || 5,
      );
      return `Memory saved: "${memory.content}" (${memory.category}, importance: ${memory.importance}/10)`;
    }

    case "file_read": {
      try {
        const content = fs.readFileSync(params.path, "utf-8");
        return content;
      } catch (err: any) {
        return `Error reading file: ${err.message}`;
      }
    }

    case "file_write": {
      try {
        const dir = path.dirname(params.path);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(params.path, params.content, "utf-8");
        return `File written: ${params.path}`;
      } catch (err: any) {
        return `Error writing file: ${err.message}`;
      }
    }

    case "file_search": {
      try {
        const { globSync } = await import("glob");
        const matches = globSync(params.pattern, {
          cwd: params.directory || process.cwd(),
          nodir: true,
        });
        return matches.length > 0
          ? matches.slice(0, 50).join("\n")
          : "No files found";
      } catch (err: any) {
        return `Error searching: ${err.message}`;
      }
    }

    case "bash_execute": {
      try {
        const output = execSync(params.command, {
          cwd: params.cwd || process.cwd(),
          timeout: 30_000,
          maxBuffer: 1024 * 1024,
          encoding: "utf-8",
        });
        return output || "(no output)";
      } catch (err: any) {
        return `Error: ${err.message}\n${err.stderr || ""}`;
      }
    }

    case "read_claude_md": {
      const filePath =
        params.scope === "global" || !params.projectPath
          ? path.join(os.homedir(), ".claude", "CLAUDE.md")
          : path.join(params.projectPath, "CLAUDE.md");
      try {
        return fs.readFileSync(filePath, "utf-8");
      } catch {
        return `Arquivo não encontrado: ${filePath}`;
      }
    }

    case "edit_claude_md": {
      const filePath =
        params.scope === "global" || !params.projectPath
          ? path.join(os.homedir(), ".claude", "CLAUDE.md")
          : path.join(params.projectPath, "CLAUDE.md");
      try {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, params.content, "utf-8");
        return `CLAUDE.md atualizado com sucesso: ${filePath}`;
      } catch (err: any) {
        return `Erro ao salvar: ${err.message}`;
      }
    }

    case "list_claude_memories": {
      const projectsDir = path.join(os.homedir(), ".claude", "projects");
      if (!fs.existsSync(projectsDir)) return "Nenhuma memória encontrada.";

      let result = "";
      const dirs = fs.readdirSync(projectsDir);
      for (const dir of dirs) {
        const memoryDir = path.join(projectsDir, dir, "memory");
        if (!fs.existsSync(memoryDir)) continue;

        const files = fs.readdirSync(memoryDir).filter((f) => f.endsWith(".md") && f !== "MEMORY.md");
        if (files.length === 0) continue;

        const label = dir.split("-").pop() || dir;
        result += `\n## ${label} (${files.length} memórias)\n`;

        for (const file of files) {
          try {
            const raw = fs.readFileSync(path.join(memoryDir, file), "utf-8");
            const nameMatch = raw.match(/name:\s*(.+)/);
            const typeMatch = raw.match(/type:\s*(.+)/);
            const descMatch = raw.match(/description:\s*(.+)/);
            result += `- **${nameMatch?.[1]?.trim() || file}** [${typeMatch?.[1]?.trim() || "other"}]: ${descMatch?.[1]?.trim() || ""}\n`;
          } catch {
            result += `- ${file}\n`;
          }
        }
      }

      return result || "Nenhuma memória encontrada.";
    }

    case "read_claude_memory": {
      const filePath = path.join(
        os.homedir(), ".claude", "projects",
        params.projectPath, "memory", params.fileName,
      );
      try {
        return fs.readFileSync(filePath, "utf-8");
      } catch {
        return `Memória não encontrada: ${filePath}`;
      }
    }

    default:
      return `Unknown tool: ${name}`;
  }
}
