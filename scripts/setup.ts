/**
 * Ō initial setup script
 * Run once: npx tsx scripts/setup.ts
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

async function main() {
  const ROOT = process.cwd();
  const ENV_PATH = path.join(ROOT, ".env");
  const ENV_EXAMPLE = path.join(ROOT, ".env.example");

  console.log("\n  Ō — Setup\n");

  // 1. Create .env
  if (fs.existsSync(ENV_PATH)) {
    console.log("  .env already exists — skipping");
  } else {
    let content = fs.readFileSync(ENV_EXAMPLE, "utf-8");

    const authToken = crypto.randomBytes(32).toString("hex");
    const mcpToken = crypto.randomBytes(32).toString("hex");

    content = content.replace("AUTH_TOKEN=CHANGE_ME", `AUTH_TOKEN=${authToken}`);
    content = content.replace("MCP_AUTH_TOKEN=", `MCP_AUTH_TOKEN=${mcpToken}`);

    fs.writeFileSync(ENV_PATH, content, "utf-8");
    console.log("  .env created with generated tokens");
  }

  // 2. Create data directory
  const dataDir = path.join(ROOT, "data");
  fs.mkdirSync(dataDir, { recursive: true });
  console.log("  data/ directory ready");

  // 3. Initialize database (runs migrations)
  const { getDb } = await import("../apps/server/src/core/db.js");
  const db = getDb();
  db.close();
  console.log("  database initialized with migrations");

  // 4. Print next steps
  console.log(`
  Setup complete!

  Next steps:
    1. Add your ANTHROPIC_API_KEY to .env
    2. Run: npm run dev
    3. Open: http://localhost:5173
    4. Click "Connect to Claude Code" in the header

  To auto-start on Windows login:
    Run scripts/install.bat as Administrator
`);
}

main();
