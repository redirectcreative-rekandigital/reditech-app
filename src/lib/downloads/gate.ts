import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Gerbang interstisial iklan (`05-ux-flows.md` F2, `04-api-spec.md` 3.2).
 *
 * Cookie `dl_gate` menandai bahwa halaman iklan untuk satu slug sudah dimuat.
 * Nilainya HMAC atas slug + waktu terbit, jadi pengguna tidak bisa memalsukan
 * gerbang lewat DevTools, dan cookie untuk item A tidak berlaku untuk item B.
 */
export const GATE_COOKIE = "dl_gate";
export const SESSION_COOKIE = "dl_session";

/** Umur cookie gerbang: 15 menit (cukup untuk hitung mundur + memilih berkas). */
export const GATE_TTL_SECONDS = 15 * 60;

/** Umur cookie sesi anonim: 1 tahun, dipakai untuk kuota unduhan anonim. */
export const SESSION_TTL_SECONDS = 365 * 24 * 60 * 60;

function gateSecret(): string {
  const secret = process.env.DL_GATE_SECRET ?? process.env.AUTH_SECRET;
  if (secret) return secret;

  // Hanya untuk pengembangan lokal; produksi wajib punya rahasia sungguhan.
  if (process.env.NODE_ENV !== "production") return "reditech-dev-gate-secret";

  throw new Error("DL_GATE_SECRET atau AUTH_SECRET wajib diisi di produksi");
}

function hmac(payload: string): string {
  return createHmac("sha256", gateSecret()).update(payload).digest("base64url");
}

/** `v1.<slug>.<issuedAtMs>.<hmac>` */
export function signGate(slug: string, issuedAt: number = Date.now()): string {
  const payload = `v1.${slug}.${issuedAt}`;
  return `${payload}.${hmac(payload)}`;
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Verifikasi cookie gerbang. `null` bila tanda tangan salah, slug berbeda,
 * atau sudah lebih dari 15 menit.
 */
export function verifyGate(
  value: string | undefined,
  slug: string,
  now: number = Date.now(),
): { issuedAt: number; expiresAt: number } | null {
  if (!value) return null;

  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return null;

  const [, signedSlug, issuedAtRaw, signature] = parts;
  if (signedSlug !== slug) return null;

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) return null;

  const expected = hmac(`v1.${signedSlug}.${issuedAtRaw}`);
  if (!safeEqual(signature, expected)) return null;

  const expiresAt = issuedAt + GATE_TTL_SECONDS * 1000;
  if (now > expiresAt) return null;

  return { issuedAt, expiresAt };
}

/**
 * Sisa hitung mundur interstisial menurut cookie gerbang. `totalSeconds` bila
 * cookie belum ada (render pertama setelah proxy memasangnya) atau tidak sah,
 * sehingga memuat ulang halaman tidak mengulang waktu.
 *
 * Perhitungan waktu berada di modul ini, bukan di komponen, supaya render tetap
 * murni (aturan `react-hooks/purity`).
 */
export function gateRemainingSeconds(
  value: string | undefined,
  slug: string,
  totalSeconds: number,
): number {
  const gate = verifyGate(value, slug);
  if (!gate) return totalSeconds;

  const elapsed = Math.max(0, Math.floor((Date.now() - gate.issuedAt) / 1000));
  return Math.max(0, totalSeconds - elapsed);
}

export function gateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: GATE_TTL_SECONDS,
  };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function createSessionId(): string {
  return randomBytes(18).toString("base64url");
}

/** Hash apa pun yang disimpan di database — IP dan user-agent tidak pernah mentah. */
export function hashIdentifier(value: string | null | undefined): string | null {
  if (!value) return null;
  return createHash("sha256").update(value).digest("hex");
}

/** Hash token unduhan; nilai mentah hanya ada di URL, tidak pernah di database. */
export function hashDownloadToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function createDownloadTokenValue(): string {
  return `dl_${randomBytes(24).toString("base64url")}`;
}

/** IP klien di belakang Cloudflare/Caddy, tanpa menyimpan nilai mentahnya. */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("cf-connecting-ip") ?? headers.get("x-forwarded-for");
  if (!forwarded) return null;
  return forwarded.split(",")[0]?.trim() ?? null;
}
