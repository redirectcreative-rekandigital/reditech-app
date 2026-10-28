import { getRedis } from "@/lib/redis";

/**
 * Rate limit sliding window (`04-api-spec.md` §1.4).
 *
 * Redis dipakai bila tersedia; tanpa Redis (mis. pengembangan lokal) dipakai
 * hitungan di memori proses. Itu cukup untuk satu instans, tetapi **tidak**
 * akurat untuk beberapa replika — karena itu Redis wajib di produksi.
 * Kuota 24 jam per item tetap ditegakkan dari database (`downloads`), jadi
 * pembatasan yang bersifat keras tidak bergantung pada Redis.
 */
export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  backend: "redis" | "memory";
};

const memoryBuckets = new Map<string, number[]>();
const MEMORY_MAX_KEYS = 5_000;

function memoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const hits = (memoryBuckets.get(key) ?? []).filter((at) => now - at < windowMs);

  if (hits.length >= limit) {
    memoryBuckets.set(key, hits);
    const oldest = hits[0] ?? now;
    return {
      ok: false,
      limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
      backend: "memory",
    };
  }

  hits.push(now);
  memoryBuckets.set(key, hits);

  if (memoryBuckets.size > MEMORY_MAX_KEYS) {
    // Buang entri tertua; kunci baru akan membuat bucket sendiri.
    const first = memoryBuckets.keys().next().value;
    if (first) memoryBuckets.delete(first);
  }

  return {
    ok: true,
    limit,
    remaining: limit - hits.length,
    retryAfterSeconds: 0,
    backend: "memory",
  };
}

export async function rateLimit({
  key,
  limit,
  windowSeconds,
}: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const windowMs = windowSeconds * 1000;
  const redis = getRedis();

  if (redis) {
    try {
      const now = Date.now();
      const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;

      await redis.zremrangebyscore(key, 0, now - windowMs);
      const count = await redis.zcard(key);

      if (count >= limit) {
        // Member berbentuk `<epochMs>-<acak>`; skor = waktu, jadi anggota
        // pertama adalah permintaan tertua dalam jendela.
        const [oldestMember] = await redis.zrange(key, "0", "0");
        const oldestAt = Number(oldestMember?.split("-")[0] ?? now);
        return {
          ok: false,
          limit,
          remaining: 0,
          retryAfterSeconds: Math.max(1, Math.ceil((oldestAt + windowMs - now) / 1000)),
          backend: "redis",
        };
      }

      await redis
        .multi()
        .zadd(key, now, member)
        .pexpire(key, windowMs)
        .exec();

      return {
        ok: true,
        limit,
        remaining: Math.max(0, limit - count - 1),
        retryAfterSeconds: 0,
        backend: "redis",
      };
    } catch {
      // Redis tidak menjawab: jangan gagalkan request pengguna.
    }
  }

  return memoryLimit(key, limit, windowMs);
}
