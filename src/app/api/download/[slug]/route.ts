import { NextResponse, connection, type NextRequest } from "next/server";

import { createSessionId, SESSION_COOKIE, sessionCookieOptions } from "@/lib/downloads/gate";
import { getDownloadItem, hasActiveEntitlement } from "@/lib/downloads/access";
import { issueDownloadToken } from "@/lib/downloads/tokens";
import { statusPageResponse } from "@/lib/http/status-page";

/**
 * `GET /api/download/[slug]` — pintu masuk tombol unduh (`04-api-spec.md` 3.1).
 *
 * Server menentukan tujuan; browser tidak pernah menerima tautan penyimpanan.
 * Auth.js baru ada di M4, sehingga `userId` masih `null` dan jalur premium
 * berakhir di halaman pembelian.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  await connection();

  const { slug } = await params;
  const item = await getDownloadItem(slug);

  if (!item) return statusPageResponse(request, "/404", 404);
  if (item.deleted) return statusPageResponse(request, "/404", 404);
  if (item.status === "ARCHIVED") return statusPageResponse(request, "/410", 410);

  if (!item.fileKey) {
    return new NextResponse("Berkas untuk item ini belum tersedia.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }

  if (item.type === "FREE") {
    return NextResponse.redirect(new URL(`/download/${slug}/ads`, request.nextUrl), 302);
  }

  const userId: string | null = null; // M4: sesi Auth.js
  if (!(await hasActiveEntitlement(userId, item.id))) {
    return NextResponse.redirect(
      new URL(`/source-code/${slug}?beli=1`, request.nextUrl),
      303,
    );
  }

  const existingSessionId = request.cookies.get(SESSION_COOKIE)?.value ?? null;
  const sessionId = existingSessionId ?? createSessionId();

  const token = await issueDownloadToken({
    itemId: item.id,
    purpose: "PREMIUM",
    userId,
    sessionId,
    ipHash: null,
  });

  const response = NextResponse.redirect(new URL(token.href, request.nextUrl), 303);
  if (!existingSessionId) {
    response.cookies.set(SESSION_COOKIE, sessionId, sessionCookieOptions());
  }

  return response;
}
