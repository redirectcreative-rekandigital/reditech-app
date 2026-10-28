import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";
import { requireCapability } from "@/lib/auth/actor";

export const metadata: Metadata = {
  title: "Antrean ulasan",
};

export default async function Page() {
  // Guard per halaman: layout tidak menghentikan render segmen lain, jadi
  // otorisasi tidak boleh bergantung pada layout (09-superadmin-admin.md 8).
  await requireCapability("item:publish");

  return (
    <RouteStub
      screen="S24"
      title="Antrean ulasan"
      description="Antrean approval revisi konten dengan tampilan diff sebelum disetujui."
      requirement="FR-ADM-01..20"
      milestone="M6"
      capability="item:publish"
      size="wide"
    />
  );
}
