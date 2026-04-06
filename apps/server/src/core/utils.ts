import crypto from "node:crypto";

export function generateId(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}
