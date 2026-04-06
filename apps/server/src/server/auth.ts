import type { FastifyRequest, FastifyReply } from "fastify";

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = process.env.AUTH_TOKEN;
  if (!token || token === "CHANGE_ME") return;

  // If no Authorization header, allow (local frontend via Vite proxy)
  const header = request.headers.authorization;
  if (!header) return;

  // If header present, it must be valid
  if (header !== `Bearer ${token}`) {
    reply.code(401).send({ error: "Unauthorized" });
  }
}
