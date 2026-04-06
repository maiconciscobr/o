import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import readline from "node:readline";

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env");
const ENV_EXAMPLE = path.join(ROOT, ".env.example");

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("\n  Ō — Setup\n");

  // 1. Check if .env exists
  if (fs.existsSync(ENV_PATH)) {
    console.log("  .env já existe — pulando criação");
  } else {
    let content = fs.readFileSync(ENV_EXAMPLE, "utf-8");

    // Generate tokens
    const authToken = crypto.randomBytes(32).toString("hex");
    const mcpToken = crypto.randomBytes(32).toString("hex");
    content = content.replace("AUTH_TOKEN=CHANGE_ME", `AUTH_TOKEN=${authToken}`);
    content = content.replace("MCP_AUTH_TOKEN=", `MCP_AUTH_TOKEN=${mcpToken}`);

    // Ask for API key
    console.log("  Para o chat funcionar, você precisa de uma Anthropic API key.");
    console.log("  Pegue em: https://console.anthropic.com/settings/keys\n");
    const apiKey = await ask("  Cole sua ANTHROPIC_API_KEY (ou Enter para pular): ");

    if (apiKey) {
      content = content.replace("ANTHROPIC_API_KEY=sk-ant-...", `ANTHROPIC_API_KEY=${apiKey}`);
      console.log("  API key salva no .env");
    } else {
      console.log("  Sem API key — o chat não vai funcionar, mas o dashboard sim.");
      console.log("  Adicione depois em .env quando quiser.");
    }

    fs.writeFileSync(ENV_PATH, content, "utf-8");
    console.log("  .env criado com tokens gerados");
  }

  // 2. Create data directory
  const dataDir = path.join(ROOT, "data");
  fs.mkdirSync(dataDir, { recursive: true });
  console.log("  data/ pronto");

  // 3. Initialize database
  try {
    const { getDb } = await import("../apps/server/src/core/db.js");
    const db = getDb();
    db.close();
    console.log("  banco de dados inicializado");
  } catch (err: any) {
    if (err.message?.includes("better-sqlite3") || err.message?.includes("node-gyp")) {
      console.log("\n  ERRO: better-sqlite3 não compilou.");
      console.log("  No Windows, você precisa do Visual Studio Build Tools:");
      console.log("    winget install Microsoft.VisualStudio.2022.BuildTools");
      console.log("  Depois rode: npm install && npm run setup\n");
      process.exit(1);
    }
    // Might fail on first run before npm install — that's ok
    console.log("  banco será criado no primeiro npm run dev");
  }

  // 4. Try to connect MCP to Claude Code
  const claudeJsonPath = path.join(
    process.env.HOME || process.env.USERPROFILE || "",
    ".claude.json",
  );

  let mcpConnected = false;
  try {
    if (fs.existsSync(claudeJsonPath)) {
      const config = JSON.parse(fs.readFileSync(claudeJsonPath, "utf-8"));

      if (!config.mcpServers) config.mcpServers = {};

      if (config.mcpServers["o-mcp"]) {
        console.log("  MCP já conectado ao Claude Code");
        mcpConnected = true;
      } else {
        const answer = await ask("  Conectar o MCP ao Claude Code automaticamente? (S/n): ");
        if (answer.toLowerCase() !== "n") {
          const mcpToken = fs.readFileSync(ENV_PATH, "utf-8").match(/MCP_AUTH_TOKEN=(.+)/)?.[1] || "";
          const dbPath = path.join(ROOT, "data", "o.db");
          const mcpEntry = path.join(ROOT, "packages", "mcp", "src", "index.ts");

          config.mcpServers["o-mcp"] = {
            type: "stdio",
            command: "npx",
            args: ["tsx", mcpEntry],
            env: {
              O_DB_PATH: dbPath,
              ...(mcpToken ? { MCP_AUTH_TOKEN: mcpToken } : {}),
            },
          };

          fs.writeFileSync(claudeJsonPath, JSON.stringify(config, null, 2), "utf-8");
          console.log("  MCP conectado ao Claude Code");
          mcpConnected = true;
        }
      }
    }
  } catch {
    console.log("  Não foi possível conectar o MCP automaticamente.");
  }

  // 5. Done
  console.log(`
  Setup completo!

  Próximo passo:
    npm run dev

  Abre http://localhost:5173${!mcpConnected ? "\n\n  Para conectar o MCP: clique em 'Conectar ao Claude Code' no header" : ""}
`);
}

main();
