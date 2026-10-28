import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";
import { requireCapability } from "@/lib/auth/actor";

export const metadata: Metadata = {
  title: "Media",
};

export default async function Page() {
  // Guard per halaman: layout tidak menghentikan render segmen lain, jadi
  // otorisasi tidak boleh bergantung pada layout (09-superadmin-admin.md 8).
  await requireCapability("media:read");

  return (
    <RouteStub
      title="Media"
      description="Pustaka media dengan unggah maksimum 5 MB dan kewajiban teks alt."
      requirement="FR-ADM-01..20"
      milestone="M3"
      capability="media:read"
      size="wide"
    />
  );
}
