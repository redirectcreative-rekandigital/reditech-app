import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";
import { requireCapability } from "@/lib/auth/actor";

export const metadata: Metadata = {
  title: "Tutorial baru",
};

export default async function Page() {
  // Guard per halaman: layout tidak menghentikan render segmen lain, jadi
  // otorisasi tidak boleh bergantung pada layout (09-superadmin-admin.md 8).
  await requireCapability("tutorial:write");

  return (
    <RouteStub
      title="Tutorial baru"
      description="Editor MDX dengan pratinjau, metadata SEO, dan pemeriksaan sebelum terbit."
      requirement="FR-ADM-01..20"
      milestone="M6"
      capability="tutorial:write"
      size="wide"
    />
  );
}
