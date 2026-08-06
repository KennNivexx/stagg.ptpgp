const records = new Map<string, { count: number; resetAt: number }>();

let redisClient: { limit: (key: string) => Promise<{ success: boolean; remaining: number; reset: number }> } | null = null;

async function initRedis() {
  if (redisClient) return;
  // Upstash's own dashboard/docs always name these UPSTASH_REDIS_REST_URL /
  // UPSTASH_REDIS_REST_TOKEN (the ".env" snippet you copy when creating a
  // database uses exactly that) — this previously only checked a
  // non-standard UPSTASH_REDIS_URL/UPSTASH_REDIS_TOKEN pair that nothing
  // ever sets, so Redis was silently never reachable even once credentials
  // existed elsewhere. Both pairs are checked, REST-suffixed preferred.
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_TOKEN;
  if (!url || !token) return;
  try {
    const { Redis } = await import("@upstash/redis");
    const { Ratelimit } = await import("@upstash/ratelimit");
    redisClient = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      analytics: true,
    });
  } catch {
    // Redis unavailable — fall through to in-memory
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
  await initRedis();
  if (redisClient) {
    const result = await redisClient.limit(key);
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
