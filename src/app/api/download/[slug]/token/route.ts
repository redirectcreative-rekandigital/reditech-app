import { NextResponse, connection, type NextRequest } from "next/server";

import { getDownloadItem, hasActiveEntitlement } from "@/lib/downloads/access";
import {
  clientIp,
  createSessionId,
  GATE_COOKIE,
  hashIdentifier,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyGate,
} from "@/lib/downloads/gate";
import {
  checkDownloadQuota,
  isDownloadPurpose,
  recordFailedDownload,
  type DownloadPurposeValue,
} from "@/lib/downloads/quota";
import { issueDownloadToken } from "@/lib/downloads/tokens";
import { apiError, requestIdFrom } from "@/lib/http/api";
import { rateLimit } from "@/lib/rate-limit";
import { getAdsEnabled } from "@/lib/settings";

type Body = { purpose?: unknown };

async function readBody(request: NextRequest): Promise<{ purpose: unknown; isForm: boolean }> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as Body | null;
    return { purpose: body?.purpose, isForm: false };
  }

  if (contentType.includes("form")) {
    const form = await request.formData().catch(() => null);
    return { purpose: form?.get("purpose"), isForm: true };
  }

  return { purpose: undefined, isForm: false };
}

/**
 * `POST /api/download/[slug]/token` — menerbitkan token sekali pakai
 * (`04-api-spec.md` 3.2). Prasyarat: cookie `dl_gate` yang dipasang proxy saat
 * halaman interstisial dimuat.
 *
 * Form tanpa JavaScript mengirim `application/x-www-form-urlencoded`; jawabannya
 * `303` ke berkas, bukan JSON. Pemanggil `fetch` menerima JSON.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  await connection();

  const { slug } = await params;
  const requestId = requestIdFrom(request);
  const { purpose: rawPurpose, isForm } = await readBody(request);

  const item = await getDownloadItem(slug);
  if (!item || item.deleted) {
    return apiError("NOT_FOUND", "Source code tidak ditemukan.", { status: 404, requestId });
  }
  if (item.status === "ARCHIVED") {
    return apiError("GONE", "Source code sudah diarsipkan.", { status: 410, requestId });
  }
  if (!item.fileKey) {
    return apiError("DEPENDENCY_UNAVAILABLE", "Berkas belum tersedia.", {
      status: 503,
      requestId,
    });
  }

  const purpose: DownloadPurposeValue = isDownloadPurpose(rawPurpose)
    ? rawPurpose
    : item.type === "FREE"
      ? "FREE_AD"
      : "PREMIUM";

  const ip = clientIp(request.headers);
  const ipHash = hashIdentifier(ip);
  const userAgent = request.headers.get("user-agent");
  const uaHash = hashIdentifier(userAgent);
  const existingSessionId = request.cookies.get(SESSION_COOKIE)?.value ?? null;
  // Sesi anonim dibuat sebelum token diterbitkan, lalu cookie yang sama dikirim
  // ke klien. Tanpa ini token pertama menyimpan `downloadSessionId = null`
  // sehingga unduhan pertama tidak ikut terhitung kuota (FR-DL-06).
  const sessionId = existingSessionId ?? createSessionId();

  const fail = (
    code: Parameters<typeof apiError>[0],
    status: number,
    message: string,
    extra?: { wait?: number },
  ) => {
    if (isForm) {
      const target = new URL(`/download/${slug}/ads`, request.nextUrl);
      target.searchParams.set("error", code.toLowerCase());
      if (extra?.wait) target.searchParams.set("wait", String(extra.wait));
      return NextResponse.redirect(target, 303);
    }

    return apiError(code, message, {
      status,
      requestId,
      details: extra?.wait ? { retryAfterSeconds: extra.wait } : undefined,
      headers: extra?.wait ? { "retry-after": String(extra.wait) } : undefined,
    });
  };

  if (purpose === "FREE_AD" && item.type !== "FREE") {
    return fail("VALIDATION_FAILED", 400, "Item premium tidak memakai jalur iklan.");
  }

  // 1. Rate limit burst per IP (Redis bila ada).
  const burst = await rateLimit({
    key: `rl:download-token:${ip ?? "unknown"}`,
    limit: 10,
    windowSeconds: 60,
  });
  if (!burst.ok) {
    return fail("RATE_LIMITED", 429, "Terlalu banyak permintaan. Coba lagi sebentar.", {
      wait: burst.retryAfterSeconds,
    });
  }

  // 2. Hak akses.
  const userId: string | null = null; // M4: sesi Auth.js

  if (purpose === "PREMIUM") {
    if (!(await hasActiveEntitlement(userId, item.id))) {
      await recordFailedDownload({
        itemId: item.id,
        userId,
        tokenId: null,
        purpose,
        result: "DENIED_NO_ENTITLEMENT",
        ipHash,
        uaHash,
      });
      return fail("NO_ENTITLEMENT", 403, "Item ini perlu dibeli lebih dulu.");
    }
  } else if ((await getAdsEnabled()) && !verifyGate(request.cookies.get(GATE_COOKIE)?.value, slug)) {
    return fail("AD_GATE_REQUIRED", 403, "Halaman iklan belum dibuka untuk item ini.");
  }

  // 3. Kuota 24 jam per item (FR-DL-06).
  const quota = await checkDownloadQuota({ itemId: item.id, userId, sessionId });
  if (!quota.allowed) {
    await recordFailedDownload({
      itemId: item.id,
      userId,
      tokenId: null,
      purpose,
      result: "DENIED_RATE_LIMIT",
      ipHash,
      uaHash,
    });
    return fail(
      "RATE_LIMITED",
      429,
      `Batas ${quota.limit} unduhan per 24 jam untuk item ini sudah tercapai.`,
      { wait: quota.retryAfterSeconds },
    );
  }

  const token = await issueDownloadToken({
    itemId: item.id,
    purpose,
    userId,
    sessionId,
    ipHash,
  });

  if (isForm) {
    const response = NextResponse.redirect(new URL(token.href, request.nextUrl), 303);
    if (!existingSessionId) {
      response.cookies.set(SESSION_COOKIE, sessionId, sessionCookieOptions());
    }
    return response;
  }

  const response = NextResponse.json(
    {
      data: {
        url: token.href,
        expiresAt: token.expiresAt.toISOString(),
        filename: `${slug}.zip`,
        sizeBytes: item.fileSize,
      },
    },
    { status: 201, headers: { "cache-control": "private, no-store", "x-request-id": requestId } },
  );

  if (!existingSessionId) {
    response.cookies.set(SESSION_COOKIE, sessionId, sessionCookieOptions());
  }

  return response;
}
