import type { FastifyRequest, FastifyReply } from "fastify";

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = process.env.AUTH_TOKEN;
  if (!token || token === "CHANGE_ME") return; // no auth configured — dev mode

  const header = request.headers.authorization;
  if (!header || header !== `Bearer ${token}`) {
    reply.code(401).send({ error: "Unauthorized" });
  }
}
