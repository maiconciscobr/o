import dotenv from "dotenv";
import path from "node:path";

// Load .env from monorepo root (cwd may be apps/server/)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
import Fastify from "fastify";
import cors from "@fastify/cors";
import { getDb } from "./core/db.js";
import { registerRoutes } from "./server/api.js";
import { authMiddleware } from "./server/auth.js";
import { startKairos, stopKairos } from "./features/kairos/index.js";

const db = getDb();
const server = Fastify({ logger: true });

await server.register(cors, { origin: true });

// Auth on all /api routes
server.addHook("onRequest", async (request, reply) => {
  if (request.url.startsWith("/api")) {
    await authMiddleware(request, reply);
  }
});

registerRoutes(server, db);

const port = Number(process.env.PORT) || 3131;

await server.listen({ port, host: "127.0.0.1" });
console.log(`Ō server listening on http://localhost:${port}`);

startKairos(db);

// Graceful shutdown
const shutdown = async () => {
  stopKairos(db);
  await server.close();
  db.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
