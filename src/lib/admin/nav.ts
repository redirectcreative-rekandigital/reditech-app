import { can, type Capability } from "@/lib/auth/permissions";
import type { Actor } from "@/lib/auth/actor";

export type AdminNavItem = {
  href: string;
  label: string;
  /** `null` = semua admin boleh melihat. */
  capability: Capability | null;
  /** Cocokkan juga sub-rute (mis. `/admin/item/[id]`). */
  prefix?: boolean;
};

export type AdminNavGroup = { title: string; items: AdminNavItem[] };

const GROUPS: AdminNavGroup[] = [
  {
    title: "Operasional",
    items: [
      { href: "/admin", label: "Ringkasan", capability: null },
      { href: "/admin/pesanan", label: "Pesanan", capability: "order:read", prefix: true },
      {
        href: "/admin/entitlement",
        label: "Entitlement",
        capability: "order:read",
        prefix: true,
      },
      { href: "/admin/audit", label: "Audit", capability: "audit:read", prefix: true },
    ],
  },
  {
    title: "Katalog",
    items: [
      { href: "/admin/item", label: "Item", capability: "item:read", prefix: true },
      { href: "/admin/kategori", label: "Kategori", capability: "taxonomy:read", prefix: true },
      { href: "/admin/teknologi", label: "Teknologi", capability: "taxonomy:read", prefix: true },
      { href: "/admin/tutorial", label: "Tutorial", capability: "tutorial:read", prefix: true },
    ],
  },
  {
    title: "Komunitas",
    items: [
      { href: "/admin/sponsor", label: "Sponsor", capability: "sponsor:read", prefix: true },
      { href: "/admin/request", label: "Usulan aplikasi", capability: "request:read", prefix: true },
      { href: "/admin/ulasan", label: "Antrean ulasan", capability: "item:publish", prefix: true },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/admin/pengguna", label: "Pengguna", capability: "user:read", prefix: true },
      { href: "/admin/media", label: "Media", capability: "media:read", prefix: true },
      {
        href: "/admin/pengaturan",
        label: "Pengaturan",
        capability: "setting:read",
        prefix: true,
      },
      { href: "/admin/mfa", label: "Keamanan akun", capability: null },
    ],
  },
];

/** Navigasi hanya menampilkan tujuan yang kapabilitasnya dimiliki aktor. */
export function adminNav(actor: Actor): AdminNavGroup[] {
  return GROUPS.map((group) => ({
    title: group.title,
    items: group.items.filter((item) => item.capability === null || can(actor, item.capability)),
  })).filter((group) => group.items.length > 0);
}
