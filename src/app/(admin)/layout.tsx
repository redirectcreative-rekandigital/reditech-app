import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const nav = [
  {
    title: "Operasional",
    items: [
      { href: "/admin", label: "Ringkasan" },
      { href: "/admin/pesanan", label: "Pesanan" },
      { href: "/admin/entitlement", label: "Entitlement" },
      { href: "/admin/audit", label: "Audit" },
    ],
  },
  {
    title: "Katalog",
    items: [
      { href: "/admin/item", label: "Item" },
      { href: "/admin/kategori", label: "Kategori" },
      { href: "/admin/teknologi", label: "Teknologi" },
      { href: "/admin/tutorial", label: "Tutorial" },
    ],
  },
  {
    title: "Komunitas",
    items: [
      { href: "/admin/sponsor", label: "Sponsor" },
      { href: "/admin/request", label: "Usulan aplikasi" },
      { href: "/admin/ulasan", label: "Antrean ulasan" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/admin/pengguna", label: "Pengguna" },
      { href: "/admin/media", label: "Media" },
      { href: "/admin/pengaturan", label: "Pengaturan" },
    ],
  },
];

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AppShell area="Admin" nav={nav} guardNote="M3">
      {children}
    </AppShell>
  );
}
