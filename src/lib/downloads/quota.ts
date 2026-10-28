import { getDailyDownloadLimit } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

/**
 * Kuota 24 jam per item (FR-DL-06). Sumber kebenaran adalah tabel `downloads`,
 * bukan Redis: kuota harus tetap berlaku setelah proses restart atau bila
 * Redis tidak tersedia.
 *
 * Unduhan anonim dihitung per `downloadSessionId` pada token, unduhan login
 * per `userId`.
 */
export type QuotaState = {
  allowed: boolean;
  limit: number;
  used: number;
  retryAfterSeconds: number;
};

type QuotaRow = { count: bigint; oldest: Date | null };

export async function checkDownloadQuota({
  itemId,
  userId,
  sessionId,
}: {
  itemId: string;
  userId: string | null;
  sessionId: string | null;
}): Promise<QuotaState> {
  const limit = await getDailyDownloadLimit();

  if (!userId && !sessionId) {
    // Tidak ada identitas sama sekali: biarkan, token tetap satu kali pakai.
    return { allowed: true, limit, used: 0, retryAfterSeconds: 0 };
  }

  const rows = await prisma.$queryRaw<QuotaRow[]>`
    SELECT count(*) AS count, min(d."createdAt") AS oldest
    FROM "downloads" d
    JOIN "download_tokens" t ON t."id" = d."tokenId"
    WHERE d."itemId" = ${itemId}
      AND d."result" = 'GRANTED'::"DownloadResult"
      AND d."createdAt" > now() - interval '24 hours'
      AND (
        (${userId}::text IS NOT NULL AND d."userId" = ${userId})
        OR (${userId}::text IS NULL AND ${sessionId}::text IS NOT NULL AND t."downloadSessionId" = ${sessionId})
      )
  `;

  const row = rows[0];
  const used = Number(row?.count ?? 0);
  const allowed = used < limit;

  let retryAfterSeconds = 0;
  if (!allowed && row?.oldest) {
    const expiresAt = new Date(row.oldest).getTime() + 24 * 60 * 60 * 1000;
    retryAfterSeconds = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000));
  }

  return { allowed, limit, used, retryAfterSeconds };
}

/** Dipakai setelah stream selesai: tambah `downloadCount` item (denormalisasi). */
export async function recordGrantedDownload({
  itemId,
  userId,
  tokenId,
  purpose,
  bytesSent,
  ipHash,
  uaHash,
  referrer,
}: {
  itemId: string;
  userId: string | null;
  tokenId: string;
  purpose: "FREE_AD" | "PREMIUM";
  bytesSent: number | null;
  ipHash: string | null;
  uaHash: string | null;
  referrer: string | null;
}): Promise<void> {
  await prisma.$transaction([
    prisma.download.create({
      data: {
        itemId,
        userId,
        tokenId,
        purpose,
        result: "GRANTED",
        bytesSent: bytesSent === null ? null : BigInt(bytesSent),
        ipHash,
        uaHash,
        referrer,
      },
    }),
    prisma.item.update({ where: { id: itemId }, data: { downloadCount: { increment: 1 } } }),
  ]);
}

/** Mencatat penolakan/kegagalan supaya FR-DL-07 berlaku untuk semua hasil. */
export async function recordFailedDownload({
  itemId,
  userId,
  tokenId,
  purpose,
  result,
  ipHash,
  uaHash,
}: {
  itemId: string;
  userId: string | null;
  tokenId: string | null;
  purpose: "FREE_AD" | "PREMIUM";
  result: "DENIED_RATE_LIMIT" | "DENIED_EXPIRED_TOKEN" | "DENIED_NO_ENTITLEMENT" | "ERROR";
  ipHash: string | null;
  uaHash: string | null;
}): Promise<void> {
  await prisma.download.create({
    data: { itemId, userId, tokenId, purpose, result, ipHash, uaHash },
  });
}

export const DOWNLOAD_PURPOSES = ["FREE_AD", "PREMIUM"] as const;
export type DownloadPurposeValue = (typeof DOWNLOAD_PURPOSES)[number];

export function isDownloadPurpose(value: unknown): value is DownloadPurposeValue {
  return value === "FREE_AD" || value === "PREMIUM";
}
