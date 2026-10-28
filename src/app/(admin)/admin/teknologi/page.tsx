import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";
import { requireCapability } from "@/lib/auth/actor";

export const metadata: Metadata = {
  title: "Teknologi",
};

export default async function Page() {
  // Guard per halaman: layout tidak menghentikan render segmen lain, jadi
  // otorisasi tidak boleh bergantung pada layout (09-superadmin-admin.md 8).
  await requireCapability("taxonomy:read");

  return (
    <RouteStub
      title="Teknologi"
      description="CRUD teknologi untuk filter katalog, dengan ikon dan pengelompokan."
      requirement="FR-ADM-01..20"
      milestone="M6"
      capability="taxonomy:read"
      size="wide"
    />
  );
}
