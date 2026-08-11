import "server-only";

import { createHmac } from "node:crypto";

const WINDOW_MS = 10 * 60 * 1_000;
const MAX_ATTEMPTS = 5;
const MAX_TRACKED_KEYS = 5_000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function pruneAttempts(now: number) {
  if (attempts.size < MAX_TRACKED_KEYS) return;

  for (const [key, attempt] of attempts) {
    if (attempt.resetAt <= now) attempts.delete(key);
  }

  if (attempts.size >= MAX_TRACKED_KEYS) {
    const oldestKey = attempts.keys().next().value;
    if (oldestKey) attempts.delete(oldestKey);
  }
}

function rateLimitKey(slug: string, ipAddress: string) {
  const secret = process.env.CLIENT_PAGE_SESSION_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret)
    .update(`${slug}:${ipAddress}`)
    .digest("hex");
}

export function recordClientPagePasswordAttempt(
  slug: string,
  ipAddress: string,
) {
  const key = rateLimitKey(slug, ipAddress);
  if (!key) return false;

  const now = Date.now();
  pruneAttempts(now);
  const existing = attempts.get(key);
  if (!existing || existing.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (existing.count >= MAX_ATTEMPTS) return false;
  existing.count += 1;
  return true;
}

export function clearClientPagePasswordAttempts(
  slug: string,
  ipAddress: string,
) {
  const key = rateLimitKey(slug, ipAddress);
  if (key) attempts.delete(key);
}
