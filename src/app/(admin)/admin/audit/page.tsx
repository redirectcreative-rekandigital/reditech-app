import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";
import { requireCapability } from "@/lib/auth/actor";

export const metadata: Metadata = {
  title: "Audit",
};

export default async function Page() {
  // Guard per halaman: layout tidak menghentikan render segmen lain, jadi
  // otorisasi tidak boleh bergantung pada layout (09-superadmin-admin.md 8).
  await requireCapability("audit:read");

  return (
    <RouteStub
      screen="S28"
      title="Audit"
      description="Log audit dengan filter aktor, aksi, dan entitas; ekspor CSV maksimal 90 hari."
      requirement="FR-ADM-01..20"
      milestone="M6"
      capability="audit:read"
      size="wide"
    />
  );
}
