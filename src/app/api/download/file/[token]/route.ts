import { NextResponse, connection, type NextRequest } from "next/server";
import { extname } from "node:path";

import { hasActiveEntitlement } from "@/lib/downloads/access";
import { clientIp, hashIdentifier } from "@/lib/downloads/gate";
import { recordFailedDownload, recordGrantedDownload } from "@/lib/downloads/quota";
import { claimDownloadToken, resolveDownloadToken, tokenUsable } from "@/lib/downloads/tokens";
import { statusPageResponse } from "@/lib/http/status-page";
import { getStorage, StorageError } from "@/lib/storage";

function filenameFor(slug: string, key: string): string {
  const extension = extname(key).toLowerCase();
  const safe = /^\.[a-z0-9]{1,5}$/.test(extension) ? extension : ".zip";
  return `${slug}${safe}`;
}

/**
 * `GET /api/download/file/[token]` — mengalirkan berkas dari `StorageProvider`
 * (`04-api-spec.md` 3.3, FR-DL-05).
 *
 * Token diklaim sebelum stream dimulai supaya dua permintaan paralel tidak bisa
 * memakai satu token. Catatan `Download(GRANTED)` ditulis setelah stream selesai.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  await connection();

  const { token: raw } = await params;
  const token = await resolveDownloadToken(raw);

  if (!token) return statusPageResponse(request, "/404", 404);

  const ipHash = hashIdentifier(clientIp(request.headers));
  const uaHash = hashIdentifier(request.headers.get("user-agent"));

  const expired = async () => {
    await recordFailedDownload({
      itemId: token.itemId,
      userId: token.userId,
      tokenId: token.id,
      purpose: token.purpose,
      result: "DENIED_EXPIRED_TOKEN",
      ipHash,
      uaHash,
    }).catch(() => {});

    return statusPageResponse(request, `/download/${token.item.slug}/expired`, 410);
  };

  if (token.item.deleted) return statusPageResponse(request, "/404", 404);
  if (token.item.status === "ARCHIVED") return statusPageResponse(request, "/410", 410);

  if (!tokenUsable(token)) return expired();

  if (token.purpose === "PREMIUM" && !(await hasActiveEntitlement(token.userId, token.itemId))) {
    await recordFailedDownload({
      itemId: token.itemId,
      userId: token.userId,
      tokenId: token.id,
      purpose: token.purpose,
      result: "DENIED_NO_ENTITLEMENT",
      ipHash,
      uaHash,
    }).catch(() => {});

    return statusPageResponse(request, "/403", 403);
  }

  if (!token.item.fileKey) {
    return new NextResponse("Berkas untuk item ini belum tersedia.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }

  // Klaim atomik: token 1x pakai, dua permintaan paralel tidak sama-sama lolos.
  if (!(await claimDownloadToken(token.id))) return expired();

  const storage = getStorage();
  let file: Awaited<ReturnType<typeof storage.open>>;

  try {
    file = await storage.open(token.item.fileKey);
  } catch (error) {
    await recordFailedDownload({
      itemId: token.itemId,
      userId: token.userId,
      tokenId: token.id,
      purpose: token.purpose,
      result: "ERROR",
      ipHash,
      uaHash,
    }).catch(() => {});

    console.error("storage.open gagal", error instanceof StorageError ? error.message : error);

    return new NextResponse("Berkas gagal dibaca. Coba lagi atau hubungi kami.", {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const filename = filenameFor(token.item.slug, token.item.fileKey);
  const referrer = request.headers.get("referer")?.slice(0, 200) ?? null;

  let bytesSent = 0;
  let finalized = false;

  const finalize = async () => {
    if (finalized) return;
    finalized = true;

    try {
      await recordGrantedDownload({
        itemId: token.itemId,
        userId: token.userId,
        tokenId: token.id,
        purpose: token.purpose,
        bytesSent,
        ipHash,
        uaHash,
        referrer,
      });
    } catch (error) {
      console.error("gagal mencatat unduhan", error);
    }
  };

  const reader = file.body.getReader();

  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          void finalize();
          return;
        }
        bytesSent += value.byteLength;
        controller.enqueue(value);
      } catch (error) {
        controller.error(error);
        await recordFailedDownload({
          itemId: token.itemId,
          userId: token.userId,
          tokenId: token.id,
          purpose: token.purpose,
          result: "ERROR",
          ipHash,
          uaHash,
        }).catch(() => {});
      }
    },
    async cancel(reason) {
      finalized = true; // klien membatalkan: bukan unduhan selesai
      await reader.cancel(reason).catch(() => {});
    },
  });

  const headers: Record<string, string> = {
    "content-type": file.contentType ?? "application/octet-stream",
    "content-disposition": `attachment; filename="${filename}"`,
    "cache-control": "private, no-store",
    "x-download-purpose": token.purpose,
    "accept-ranges": storage.supportsRange ? "bytes" : "none",
    "x-content-type-options": "nosniff",
  };

  const size = file.sizeBytes ?? token.item.fileSize;
  if (size && size > 0) headers["content-length"] = String(size);

  return new NextResponse(body, { status: 200, headers });
}
