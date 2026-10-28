import type { Capability } from "@/lib/auth/permissions";

/**
 * Peta rute panel → kapabilitas minimum. Dipakai proxy untuk memutuskan `403`
 * sebelum shell PPR terkirim; halaman tetap memanggil `requireCapability()`
 * sendiri sebagai lapisan kedua (dan itu yang menjadi sumber kebenaran).
 *
 * Urutan penting: rute yang lebih spesifik (`/admin/item/new`) harus diperiksa
 * sebelum rute induknya (`/admin/item`).
 */
const ROUTES: Array<{ pattern: RegExp; capability: Capability | null }> = [
  { pattern: /^\/admin$/, capability: null },
  { pattern: /^\/admin\/mfa$/, capability: null },
  { pattern: /^\/admin\/item\/new$/, capability: "item:write" },
  { pattern: /^\/admin\/item(\/|$)/, capability: "item:read" },
  { pattern: /^\/admin\/kategori(\/|$)/, capability: "taxonomy:read" },
  { pattern: /^\/admin\/teknologi(\/|$)/, capability: "taxonomy:read" },
  { pattern: /^\/admin\/tutorial\/new$/, capability: "tutorial:write" },
  { pattern: /^\/admin\/tutorial(\/|$)/, capability: "tutorial:read" },
  { pattern: /^\/admin\/ulasan(\/|$)/, capability: "item:publish" },
  { pattern: /^\/admin\/pesanan(\/|$)/, capability: "order:read" },
  { pattern: /^\/admin\/entitlement(\/|$)/, capability: "entitlement:grant" },
  { pattern: /^\/admin\/sponsor(\/|$)/, capability: "sponsor:read" },
  { pattern: /^\/admin\/request(\/|$)/, capability: "request:read" },
  { pattern: /^\/admin\/pengguna(\/|$)/, capability: "user:read" },
  { pattern: /^\/admin\/media(\/|$)/, capability: "media:read" },
  { pattern: /^\/admin\/pengaturan(\/|$)/, capability: "setting:read" },
  { pattern: /^\/admin\/audit(\/|$)/, capability: "audit:read" },
];

/** `undefined` = rute panel yang belum dipetakan (halaman akan 404 sendiri). */
export function adminPathCapability(pathname: string): Capability | null | undefined {
  const normalized = pathname.toLowerCase().replace(/\/$/, "") || "/";

  for (const route of ROUTES) {
    if (route.pattern.test(normalized)) return route.capability;
  }

  return undefined;
}
