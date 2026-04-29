// Simple per-process token bucket rate limiter.
// For multi-instance deployments, swap to Upstash Redis (`@upstash/ratelimit`)
// at the call sites — the public shape stays the same.

type Bucket = { count: number; resetAt: number };
const memory = new Map<string, Bucket>();

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number };

export function rateLimit(
  key: string,
  opts: { windowMs: number; max: number }
): RateLimitResult {
  const now = Date.now();
  const b = memory.get(key);
  if (!b || b.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true };
  }
  if (b.count >= opts.max) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count++;
  return { ok: true };
}

export function ipFrom(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xreal = req.headers.get('x-real-ip');
  if (xreal) return xreal.trim();
  return 'unknown';
}

// Periodic GC so the map doesn't grow unbounded in long-lived processes.
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, b] of memory) {
      if (b.resetAt < now) memory.delete(k);
    }
  }, 5 * 60_000).unref?.();
}
