import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";
import { requireCapability } from "@/lib/auth/actor";

export const metadata: Metadata = {
  title: "Pengaturan",
};

export default async function Page() {
  // Guard per halaman: layout tidak menghentikan render segmen lain, jadi
  // otorisasi tidak boleh bergantung pada layout (09-superadmin-admin.md 8).
  await requireCapability("setting:read");

  return (
    <RouteStub
      screen="S27"
      title="Pengaturan"
      description="Pengaturan situs per tab: Umum, Harga, Pembayaran, Iklan, Email, SEO, dan Keamanan."
      requirement="FR-ADM-01..20"
      milestone="M3"
      capability="setting:read"
      size="wide"
    />
  );
}
