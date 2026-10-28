import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";
import { requireCapability } from "@/lib/auth/actor";

export const metadata: Metadata = {
  title: "Pesanan",
};

export default async function Page() {
  // Guard per halaman: layout tidak menghentikan render segmen lain, jadi
  // otorisasi tidak boleh bergantung pada layout (09-superadmin-admin.md 8).
  await requireCapability("order:read");

  return (
    <RouteStub
      screen="S25"
      title="Pesanan"
      description="Daftar pesanan dengan filter status pembayaran dan rentang tanggal."
      requirement="FR-ADM-01..20"
      milestone="M5"
      capability="order:read"
      size="wide"
    />
  );
}
