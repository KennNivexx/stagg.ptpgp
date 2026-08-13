const records = new Map<string, { count: number; resetAt: number }>();

type RatelimitClient = { limit: (key: string) => Promise<{ success: boolean; remaining: number; reset: number }> };

// Previously a single Ratelimit instance was built once with a hardcoded
// slidingWindow(10, "10 s") — every caller's own maxRequests/windowMs args
// were silently ignored whenever Redis was configured, so e.g. the public
// chatbot's "20 per 10 min" and a stricter "5 per 5 min" elsewhere both
// actually enforced 10-per-10s in production. Cache one Ratelimit instance
// per distinct (maxRequests, windowMs) pair instead, so each call site's
// declared limit is the one actually enforced.
const redisLimiters = new Map<string, RatelimitClient>();
let redisUnavailable = false;

async function getRedisLimiter(maxRequests: number, windowMs: number): Promise<RatelimitClient | null> {
  if (redisUnavailable) return null;
  const configKey = `${maxRequests}:${windowMs}`;
  const existing = redisLimiters.get(configKey);
  if (existing) return existing;

  // Upstash's own dashboard/docs always name these UPSTASH_REDIS_REST_URL /
  // UPSTASH_REDIS_REST_TOKEN (the ".env" snippet you copy when creating a
  // database uses exactly that) — this previously only checked a
  // non-standard UPSTASH_REDIS_URL/UPSTASH_REDIS_TOKEN pair that nothing
  // ever sets, so Redis was silently never reachable even once credentials
  // existed elsewhere. Both pairs are checked, REST-suffixed preferred.
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_TOKEN;
  if (!url || !token) {
    redisUnavailable = true;
    return null;
  }
  try {
    const { Redis } = await import("@upstash/redis");
    const { Ratelimit } = await import("@upstash/ratelimit");
    const client = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(maxRequests, `${Math.max(1, Math.round(windowMs / 1000))} s`),
      analytics: true,
      prefix: `ratelimit:${configKey}`,
    });
    redisLimiters.set(configKey, client);
    return client;
  } catch {
    redisUnavailable = true;
    return null;
  }
}

function cleanExpired(now: number) {
  for (const [key, rec] of records) {
    if (now > rec.resetAt) records.delete(key);
  }
}

let lastClean = 0;

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ limited: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();

  // Try Redis (production)
  const client = await getRedisLimiter(maxRequests, windowMs);
  if (client) {
    const result = await client.limit(key);
    return {
      limited: !result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    };
  }

  // Fallback: in-memory Map (dev / localhost / single-instance)
  if (now - lastClean > 60_000) {
    cleanExpired(now);
    lastClean = now;
  }

  const record = records.get(key);
  if (!record || now > record.resetAt) {
    records.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { limited: true, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { limited: false, remaining: maxRequests - record.count, resetAt: record.resetAt };
}
