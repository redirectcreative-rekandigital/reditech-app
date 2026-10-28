import { NextResponse, type NextRequest } from "next/server";

import {
  catalogHref,
  catalogTotalPages,
  countCatalogForFilters,
  parseCatalogFilters,
} from "@/lib/catalog";
import { adminPathCapability } from "@/lib/admin/route-capability";
import {
  GATE_COOKIE,
  gateCookieOptions,
  signGate,
  verifyGate,
} from "@/lib/downloads/gate";
import { SESSION_COOKIE, MFA_CHALLENGE_COOKIE } from "@/lib/auth/cookies";
import { hasCapability } from "@/lib/auth/permissions";
import { sessionActorForToken } from "@/lib/auth/proxy-session";
import { getItemAccess, getItemStatus } from "@/lib/items";

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
const ADMIN_PATH = /^\/admin(\/|$)/;
const DOWNLOAD_PATH = /^\/download(\/|$)/;
const API_PATH = /^\/api(\/|$)/;
const ITEM_PATH = /^\/source-code\/([^/]+)$/;
const ADS_PATH = /^\/download\/([^/]+)\/ads$/;
const EXPIRED_PATH = /^\/download\/([^/]+)\/expired$/;

/**
 * Token unduhan adalah nilai acak base64url yang **peka huruf besar-kecil**.
 * Menurunkan path ini akan mengubah hash token dan membuat tautan yang baru
 * terbit langsung tidak dikenal (terverifikasi: `308` lalu `404`).
 */
const CASE_SENSITIVE_PATH = /^\/api\/download\/file\//;

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
 *
 * `upgrade-insecure-requests` hanya dikirim bila permintaan memang sudah https.
 * Diuji: saat `next start` lokal diakses lewat http, direktif itu membuat
 * prefetch RSC internal (`http://localhost:3100/admin/mfa`) di-upgrade menjadi
 * https dan gagal (`ERR_SSL_PROTOCOL_ERROR`), sehingga navigasi klien tertinggal
 * di halaman lama. Di produksi (Caddy + Cloudflare) permintaan selalu https.
 */
function contentSecurityPolicy(isDev: boolean, isHttps: boolean) {
  const directives = [
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
  ];

  if (isHttps) directives.push("upgrade-insecure-requests");

  return directives.join("; ");
}

/** Header keamanan + kebijakan cache untuk semua respons publik. */
function applyHeaders(
  response: NextResponse,
  requestId: string,
  lowerPath: string,
  method: string,
  isHttps: boolean,
) {
  response.headers.set(
    "content-security-policy",
    contentSecurityPolicy(process.env.NODE_ENV === "development", isHttps),
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

  if (PRIVATE_PATH.test(lowerPath) || DOWNLOAD_PATH.test(lowerPath)) {
    // Panel internal dan halaman unduhan tidak boleh masuk indeks. Halaman
    // unduhan juga menyetel cookie gerbang dan memuat hitung mundur per
    // permintaan, jadi tidak boleh disimpan cache bersama.
    response.headers.set("x-robots-tag", "noindex, nofollow");
    response.headers.set(
      "cache-control",
      "private, no-cache, no-store, max-age=0, must-revalidate",
    );
  } else if (API_PATH.test(lowerPath)) {
    response.headers.set("cache-control", "private, no-store");
    response.headers.set("x-robots-tag", "noindex, nofollow");
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
 */
async function catalogRedirect(nextUrl: NextRequest["nextUrl"]): Promise<string | null> {
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

/** Protokol efektif: di produksi TLS berakhir di Caddy/Cloudflare. */
function isHttpsRequest(request: NextRequest): boolean {
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwarded) return forwarded === "https";
  return request.nextUrl.protocol === "https:";
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
    isHttpsRequest(request),
  );
}

export default async function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const requestId = crypto.randomUUID();
  const lowerPath = nextUrl.pathname.toLowerCase();
  const isHttps = isHttpsRequest(request);

  // Teruskan `x-request-id` ke route handler/page agar amplop error memakai
  // nilai yang sama dengan header respons (bukan id acak baru), dan
  // `x-pathname` agar layout bisa tahu rute aktif (Layout tidak menerima URL).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.set("x-pathname", nextUrl.pathname);
  const forward = () => NextResponse.next({ request: { headers: requestHeaders } });

  // Permintaan internal untuk mengambil HTML halaman status: jangan diproses
  // ulang, cukup render halamannya.
  if (request.headers.get(STATUS_PAGE_HEADER) === "1") {
    return applyHeaders(forward(), requestId, lowerPath, request.method, isHttps);
  }

  // 1. Apex → www. Caddy juga menangani ini; proxy menjadi jaring pengaman.
  if (host === APEX_HOST) {
    const target = new URL(`${nextUrl.pathname}${nextUrl.search}`, `https://${CANONICAL_HOST}`);
    return NextResponse.redirect(target, 308);
  }

  // 2. Path huruf besar → huruf kecil (slug kanonik selalu huruf kecil).
  if (lowerPath !== nextUrl.pathname && !CASE_SENSITIVE_PATH.test(nextUrl.pathname)) {
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
          isHttps,
        );
      }
    } catch {
      // Database tidak tersedia: biarkan halaman menampilkan error 500-nya
      // sendiri, jangan menukar gangguan sementara dengan 410/404 permanen.
    }
  }

  // 5. Halaman unduhan: 404/410 ditegakkan sebelum render. Cookie `dl_gate`
  //    juga dipasang di sini karena Server Component tidak boleh menulis cookie;
  //    render pertama halaman iklan belum melihat cookie itu, jadi hitung
  //    mundurnya dimulai dari durasi penuh. Setelah itu waktu dihitung server
  //    dari cookie, sehingga memuat ulang tidak mengulang hitung mundur.
  const downloadMatch = ADS_PATH.exec(lowerPath) ?? EXPIRED_PATH.exec(lowerPath);
  if (request.method === "GET" && downloadMatch) {
    const isAdsPage = ADS_PATH.test(lowerPath);
    let slug: string | null = null;

    try {
      slug = decodeURIComponent(downloadMatch[1]);
      const access = await getItemAccess(slug);

      if (!access || access.status === "missing") {
        return applyHeaders(
          NextResponse.rewrite(new URL("/404", nextUrl), { status: 404 }),
          requestId,
          lowerPath,
          request.method,
          isHttps,
        );
      }

      if (access.status === "archived") {
        return await statusPage(request, "/410", 410, requestId);
      }

      // Item premium tidak punya jalur iklan; arahkan ke halaman pembelian
      // sebelum shell PPR terkirim (di dalam render, `redirect()` hanya
      // menghasilkan pengalihan sisi klien dengan status 200).
      if (isAdsPage && access.type === "PREMIUM") {
        return NextResponse.redirect(
          new URL(`/source-code/${slug}?beli=1`, nextUrl),
          303,
        );
      }
    } catch {
      // Database tidak tersedia atau slug rusak: biarkan halaman menangani.
      slug = null;
    }

    if (slug && isAdsPage && !verifyGate(request.cookies.get(GATE_COOKIE)?.value, slug)) {
      const response = forward();
      response.cookies.set(GATE_COOKIE, signGate(slug), gateCookieOptions());
      return applyHeaders(response, requestId, lowerPath, request.method, isHttps);
    }
  }

  // 6. Panel admin: anonim → login, non-admin → 403, admin tanpa MFA → enrol.
  //    Pemeriksaan dilakukan di sini karena setelah shell PPR terkirim status
  //    tidak bisa diubah (sama seperti 404/410 item). Halaman dan Server Action
  //    tetap memanggil `requireAdmin()`/`requireCapability()` sendiri sebagai
  //    lapisan kedua.
  if (request.method === "GET" && ADMIN_PATH.test(lowerPath)) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("redirect", `${nextUrl.pathname}${nextUrl.search}`);

    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.redirect(loginUrl, 307);

    // `null` = sesi tidak sah; `undefined` = database tidak terjangkau, dan
    // gangguan sementara tidak boleh diperlakukan sebagai "keluar".
    let actor: Awaited<ReturnType<typeof sessionActorForToken>> | undefined;
    try {
      actor = await sessionActorForToken(token);
    } catch {
      actor = undefined;
    }

    if (actor === null) {
      const response = NextResponse.redirect(loginUrl, 307);
      response.cookies.delete(SESSION_COOKIE);
      return applyHeaders(response, requestId, lowerPath, request.method, isHttps);
    }

    if (actor) {
      if (actor.role !== "ADMIN" && actor.role !== "SUPERADMIN") {
        return await statusPage(request, "/403", 403, requestId);
      }

      // AC-ADM-11: tanpa TOTP hanya halaman enrol yang boleh dibuka.
      if (!actor.mfaEnabled && lowerPath !== "/admin/mfa") {
        return NextResponse.redirect(new URL("/admin/mfa", nextUrl), 307);
      }

      // 403 per kapabilitas juga harus terjadi sebelum render; `forbidden()` di
      // dalam halaman hanya menghasilkan pengalihan sisi klien dengan status 200.
      const required = adminPathCapability(lowerPath);
      if (required && !hasCapability(actor, required)) {
        return await statusPage(request, "/403", 403, requestId);
      }
    }
  }

  // 7. Verifikasi MFA tanpa cookie tantangan tidak punya apa pun untuk
  //    diverifikasi: kembali ke form masuk sebelum shell terkirim.
  if (request.method === "GET" && lowerPath === "/login/mfa") {
    if (!request.cookies.get(MFA_CHALLENGE_COOKIE)?.value) {
      const loginUrl = new URL("/login", nextUrl);
      const redirectParam = nextUrl.searchParams.get("redirect");
      if (redirectParam) loginUrl.searchParams.set("redirect", redirectParam);
      return NextResponse.redirect(loginUrl, 307);
    }
  }

  // 8. Header keamanan dan kebijakan cache.
  return applyHeaders(forward(), requestId, lowerPath, request.method, isHttps);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/|cdn-cgi/).*)"],
};
