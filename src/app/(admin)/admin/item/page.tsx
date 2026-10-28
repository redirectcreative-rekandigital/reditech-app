import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";
import { requireCapability } from "@/lib/auth/actor";

export const metadata: Metadata = {
  title: "Item",
};

export default async function Page() {
  // Guard per halaman: layout tidak menghentikan render segmen lain, jadi
  // otorisasi tidak boleh bergantung pada layout (09-superadmin-admin.md 8).
  await requireCapability("item:read");

  return (
    <RouteStub
      screen="S23"
      title="Item"
      description="Daftar item dengan filter status dan aksi massal (arsip, terbitkan, ubah kategori)."
      requirement="FR-ADM-01..20"
      milestone="M3"
      capability="item:read"
      size="wide"
    />
  );
}
