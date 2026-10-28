import { NextResponse, type NextRequest } from "next/server";

/** Header internal agar proxy tidak memproses ulang permintaan halaman status. */
export const STATUS_PAGE_HEADER = "x-reditech-status-page";

/**
 * Mengambil HTML halaman status internal lalu membalasnya dengan status yang
 * diminta — dipakai route handler yang perlu status `404`/`403`/`410` sambil
 * tetap menampilkan halaman bergaya situs.
 *
 * Alasan sama dengan proxy: route handler tidak bisa me-rewrite ke halaman, dan
 * `NextResponse.rewrite` tidak tersedia di sini.
 */
export async function statusPageResponse(
  request: NextRequest | Request,
  pathname: string,
  status: number,
): Promise<NextResponse> {
  const url = new URL(pathname, request.url);

  const rendered = await fetch(url, {
    headers: { [STATUS_PAGE_HEADER]: "1" },
    cache: "no-store",
  });

  return new NextResponse(await rendered.text(), {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
