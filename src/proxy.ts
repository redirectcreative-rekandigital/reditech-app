import { NextResponse, type NextRequest } from "next/server";

import {
  catalogHref,
  catalogTotalPages,
  countCatalogForFilters,
  parseCatalogFilters,
} from "@/lib/catalog";
import { getItemStatus } from "@/lib/items";

/**
 * Proxy (dulu `middleware`) — `12-route-map.md` 12.
 *
 * Perannya bukan hanya header: status HTTP final untuk katalog dan item
 * ditentukan di sini. Begitu shell PPR terkirim, `permanentRedirect` atau
 * `notFound()` di halaman hanya menjadi pengalihan/soft-404 sisi klien dengan
 * status 200, sehingga validasi `page` dan status item harus terjadi sebelum
 * render.
 */
const APEX_HOST = "reditech.id";
const CANONICAL_HOST = "www.reditech.id";

const PRIVATE_PATH = /^\/(admin|dashboard)(\/|$)/;
const API_PATH = /^\/api(\/|$)/;
const ITEM_PATH = /^\/source-code\/([^/]+)$/;

const CATALOG_PARAMS = new Set(["kategori", "page", "search", "sort", "type"]);

/** Penanda permintaan internal saat proxy mengambil HTML halaman status. */
const STATUS_PAGE_HEADER = "x-reditech-status-page";

/**
 * CSP tanpa nonce. Cache Components selalu mem-prerender shell statis (PPR),
 * sehingga sebagian `<script>` sudah dibekukan saat build dan tidak mungkin
 * diberi nonce per permintaan; `'strict-dynamic'` akan memblokir justru
 * skrip bootstrap Next. Karena HTML kita tidak pernah memuat masukan pengguna
 * yang direfleksikan, `'unsafe-inline'` dipakai khusus untuk skrip/gaya.
 * Rasional lengkap: `12-route-map.md` 12.1.
 */
function contentSecurityPolicy(isDev: boolean) {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.r2.dev https://cdn.reditech.id",
    "font-src 'self' data:",
    "connect-src 'self' https://api.doku.com https://sandbox.doku.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/** Header keamanan + kebijakan cache untuk semua respons publik. */
function applyHeaders(response: NextResponse, requestId: string, lowerPath: string, method: string) {
  response.headers.set(
    "content-security-policy",
    contentSecurityPolicy(process.env.NODE_ENV === "development"),
  );
  response.headers.set("x-request-id", requestId);
  response.headers.set(
    "strict-transport-security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");

  if (PRIVATE_PATH.test(lowerPath)) {
    // Panel internal tidak boleh masuk indeks, termasuk bila URL bocor.
    response.headers.set("x-robots-tag", "noindex, nofollow");
    response.headers.set(
      "cache-control",
      "private, no-cache, no-store, max-age=0, must-revalidate",
    );
  } else if (API_PATH.test(lowerPath)) {
    response.headers.set("cache-control", "private, no-store");
  } else if (method === "GET") {
    // HTML publik: Cloudflare tidak meng-cache, tetapi boleh direvalidasi.
    response.headers.set("cache-control", "public, max-age=0, must-revalidate");
  }

  return response;
}

/**
 * `page` tidak sah atau di luar rentang → URL kanonik (308). Parameter yang
 * tidak dikenal (mis. `utm_source`) membuat normalisasi dilewati supaya
 * kampanye tidak hilang.
 */async function catalogRedirect(nextUrl: NextRequest["nextUrl"]): Promise<string | null> {
  const filters = parseCatalogFilters(Object.fromEntries(nextUrl.searchParams));

  if (filters.page === 0) {
    return catalogHref(filters, { page: 1 });
  }

  try {
    const totalPages = catalogTotalPages(await countCatalogForFilters(filters));

    if (filters.page > totalPages) {
      return catalogHref(filters, { page: totalPages });
    }
  } catch {
    // Database tidak tersedia: halaman akan menampilkan error sendiri.
    return null;
  }

  const onlyKnownParams = [...nextUrl.searchParams.keys()].every((key) =>
    CATALOG_PARAMS.has(key),
  );

  if (!onlyKnownParams) return null;

  const canonical = catalogHref(filters);
  return nextUrl.pathname + nextUrl.search === canonical ? null : canonical;
}

/**
 * Ambil HTML halaman status internal lalu kirim ulang dengan status yang
 * diminta.
 *
 * `rewrite(url, { status: 410 })` dihormati di `next dev`, tetapi pada
 * `next start` halaman `/410` dilayani dari cache statis dan status 200 milik
 * entri cache itu menimpa status dari proxy (terverifikasi). Karena Next tidak
 * punya API halaman untuk 410, HTML-nya diambil sekali lalu dibungkus ulang
 * dengan status yang benar.
 */
async function statusPage(
  request: NextRequest,
  pathname: string,
  status: number,
  requestId: string,
) {
  const rendered = await fetch(new URL(pathname, request.nextUrl), {
    headers: { [STATUS_PAGE_HEADER]: "1" },
    cache: "no-store",
  });

  return applyHeaders(
    new NextResponse(await rendered.text(), {
      status,
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
    requestId,
    request.nextUrl.pathname.toLowerCase(),
    request.method,
  );
}

export default async function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const requestId = crypto.randomUUID();
  const lowerPath = nextUrl.pathname.toLowerCase();

  // Permintaan internal untuk mengambil HTML halaman status: jangan diproses
  // ulang, cukup render halamannya.
  if (request.headers.get(STATUS_PAGE_HEADER) === "1") {
    return applyHeaders(NextResponse.next(), requestId, lowerPath, request.method);
  }

  // 1. Apex → www. Caddy juga menangani ini; proxy menjadi jaring pengaman.
  if (host === APEX_HOST) {
    const target = new URL(`${nextUrl.pathname}${nextUrl.search}`, `https://${CANONICAL_HOST}`);
    return NextResponse.redirect(target, 308);
  }

  // 2. Path huruf besar → huruf kecil (slug kanonik selalu huruf kecil).
  if (lowerPath !== nextUrl.pathname) {
    return NextResponse.redirect(new URL(`${lowerPath}${nextUrl.search}`, nextUrl), 308);
  }

  // 3. Katalog: `page` di luar rentang/tidak sah → 308 ke URL kanonik.
  //    FR-CAT-08/09 melarang 500, dan 200 berisi pengalihan klien bukan 308.
  if (request.method === "GET" && lowerPath === "/source-code") {
    const redirectTo = await catalogRedirect(nextUrl);
    if (redirectTo) {
      return NextResponse.redirect(new URL(redirectTo, nextUrl), 308);
    }
  }

  // 4. Item: arsip → 410, draf/tidak ada → 404. Next tidak punya API halaman
  //    untuk status ini, tetapi `rewrite` menerima status sendiri tanpa
  //    mengubah URL di bilah alamat.
  const itemMatch = ITEM_PATH.exec(lowerPath);
  if (request.method === "GET" && itemMatch) {
    try {
      const status = await getItemStatus(decodeURIComponent(itemMatch[1]));

      if (status === "archived") {
        return await statusPage(request, "/410", 410, requestId);
      }

      if (status === "missing") {
        // `/404` diperlakukan Next sebagai halaman 404, jadi `rewrite` dengan
        // status 404 sudah cukup di sini.
        return applyHeaders(
          NextResponse.rewrite(new URL("/404", nextUrl), { status: 404 }),
          requestId,
          lowerPath,
          request.method,
        );
      }
    } catch {
      // Database tidak tersedia: biarkan halaman menampilkan error 500-nya
      // sendiri, jangan menukar gangguan sementara dengan 410/404 permanen.
    }
  }

  // 5. Header keamanan dan kebijakan cache.
  return applyHeaders(NextResponse.next(), requestId, lowerPath, request.method);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/|cdn-cgi/).*)"],
};
