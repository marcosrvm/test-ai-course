// Simple in-memory rate limits per server instance (sliding window per IP).
// Not a hard cost cap – that is the prepaid Gemini balance – just protection against floods.

// Shown in the chat widget and the handover form (German: customer-facing).
export const RATE_LIMIT_TEXT =
  "Du hast gerade sehr viele Nachrichten geschickt. Bitte versuch es in ein paar Minuten noch einmal.";

const hits = new Map<string, number[]>();
const MAX_KEYS = 10_000;

// Client IP: first value of x-forwarded-for (set by Vercel), "unknown" otherwise.
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// Records a hit and returns false when the limit for this bucket + IP is exceeded.
export function allowRequest(bucket: string, ip: string, limit: number, windowMs: number): boolean {
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  // Keep memory bounded: drop the oldest keys when the map grows too large.
  if (hits.size > MAX_KEYS) hits.delete(hits.keys().next().value!);
  return true;
}
