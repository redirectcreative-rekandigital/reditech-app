import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";
import { requireCapability } from "@/lib/auth/actor";

export const metadata: Metadata = {
  title: "Sponsor",
};

export default async function Page() {
  // Guard per halaman: layout tidak menghentikan render segmen lain, jadi
  // otorisasi tidak boleh bergantung pada layout (09-superadmin-admin.md 8).
  await requireCapability("sponsor:read");

  return (
    <RouteStub
      title="Sponsor"
      description="Daftar sponsor dan antrean moderasi materi iklan."
      requirement="FR-ADM-01..20"
      milestone="M6"
      capability="sponsor:read"
      size="wide"
    />
  );
}
