import { TRPCError } from "@trpc/server";

type Attempt = { count: number; resetAt: number };
const attempts = new Map<string, Attempt>();
const WINDOW_MS = 15 * 60 * 1000;
const LIMIT = 8;

export function enforceAuthRateLimit(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  if (current.count >= LIMIT) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many account attempts. Please wait a few minutes and try again." });
  }
  current.count += 1;
}

export function resetAuthRateLimit(key: string) {
  attempts.delete(key);
}
