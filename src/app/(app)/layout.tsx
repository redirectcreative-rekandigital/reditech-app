import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const nav = [
  {
    title: "Akun",
    items: [
      { href: "/dashboard", label: "Ringkasan" },
      { href: "/dashboard/source-code", label: "Source code saya" },
      { href: "/dashboard/pembelian", label: "Pembelian" },
      { href: "/dashboard/unduhan", label: "Unduhan" },
    ],
  },
  {
    title: "Pengaturan",
    items: [
      { href: "/dashboard/profile", label: "Profil" },
      { href: "/dashboard/profile/keamanan", label: "Keamanan" },
    ],
  },
];

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AppShell area="Dashboard" nav={nav} guardNote="M4">
      {children}
    </AppShell>
  );
}
