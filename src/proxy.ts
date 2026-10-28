import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (dulu `middleware`) — `12-route-map.md` 12.
 * Urutan: apex → www, kanonikalisasi huruf, header keamanan, lalu (M3/M4)
 * guard sesi.
 */
const APEX_HOST = "reditech.id";
const CANONICAL_HOST = "www.reditech.id";

const PRIVATE_PATH = /^\/(admin|dashboard)(\/|$)/;
const API_PATH = /^\/api(\/|$)/;

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

export default function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const requestId = crypto.randomUUID();

  // 1. Apex → www. Caddy juga menangani ini; proxy menjadi jaring pengaman.
  if (host === APEX_HOST) {
    const target = new URL(`${nextUrl.pathname}${nextUrl.search}`, `https://${CANONICAL_HOST}`);
    return NextResponse.redirect(target, 308);
  }

  // 2. Path huruf besar → huruf kecil (slug kanonik selalu huruf kecil).
  const lowerPath = nextUrl.pathname.toLowerCase();
  if (lowerPath !== nextUrl.pathname) {
    return NextResponse.redirect(new URL(`${lowerPath}${nextUrl.search}`, nextUrl), 308);
  }

  // 3. Header keamanan untuk semua respons.
  const response = NextResponse.next();
  response.headers.set("content-security-policy", contentSecurityPolicy(process.env.NODE_ENV === "development"));
  response.headers.set("x-request-id", requestId);
  response.headers.set(
    "strict-transport-security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");

  // 4. Kebijakan cache per kelompok rute.
  if (PRIVATE_PATH.test(lowerPath)) {
    // Panel internal tidak boleh masuk indeks, termasuk bila URL bocor.
    response.headers.set("x-robots-tag", "noindex, nofollow");
    response.headers.set(
      "cache-control",
      "private, no-cache, no-store, max-age=0, must-revalidate",
    );
  } else if (API_PATH.test(lowerPath)) {
    response.headers.set("cache-control", "private, no-store");
  } else if (request.method === "GET") {
    // HTML publik: Cloudflare tidak meng-cache, tetapi boleh direvalidasi.
    response.headers.set("cache-control", "public, max-age=0, must-revalidate");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/|cdn-cgi/).*)"],
};
