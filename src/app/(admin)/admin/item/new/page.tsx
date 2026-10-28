import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";
import { requireCapability } from "@/lib/auth/actor";

export const metadata: Metadata = {
  title: "Item baru",
};

export default async function Page() {
  // Guard per halaman: layout tidak menghentikan render segmen lain, jadi
  // otorisasi tidak boleh bergantung pada layout (09-superadmin-admin.md 8).
  await requireCapability("item:write");

  return (
    <RouteStub
      screen="S23"
      title="Item baru"
      description="Editor item dengan tab Dasar, Konten, Harga, Berkas, Galeri, dan SEO."
      requirement="FR-ADM-01..20"
      milestone="M3"
      capability="item:write"
      size="wide"
    />
  );
}
