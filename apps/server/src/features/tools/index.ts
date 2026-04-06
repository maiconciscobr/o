import type Anthropic from "@anthropic-ai/sdk";
import type Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
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

    default:
      return `Unknown tool: ${name}`;
  }
}
