import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";
import { requireCapability } from "@/lib/auth/actor";

export const metadata: Metadata = {
  title: "Tutorial",
};

export default async function Page() {
  // Guard per halaman: layout tidak menghentikan render segmen lain, jadi
  // otorisasi tidak boleh bergantung pada layout (09-superadmin-admin.md 8).
  await requireCapability("tutorial:read");

  return (
    <RouteStub
      title="Tutorial"
      description="Daftar artikel tutorial beserta status publikasi dan penulisnya."
      requirement="FR-ADM-01..20"
      milestone="M6"
      capability="tutorial:read"
      size="wide"
    />
  );
}
