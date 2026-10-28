import Redis from "ioredis";

/**
 * Klien Redis tunggal. `lazyConnect` dipakai agar proses build tidak mencoba
 * menyambung; koneksi dibuka pada pemakaian pertama.
 */
const globalForRedis = globalThis as unknown as { redis?: Redis | null };

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (globalForRedis.redis !== undefined) return globalForRedis.redis;

  const client = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 1500,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });

  // Kegagalan koneksi dilaporkan lewat health check, bukan log tiap retry.
  client.on("error", () => {});

  globalForRedis.redis = client;
  return client;
}

/** `true` hanya bila Redis menjawab PING dalam batas waktu. */
export async function pingRedis(): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;

  try {
    if (client.status === "wait") await client.connect();
    return (await client.ping()) === "PONG";
  } catch {
    return false;
  }
}
