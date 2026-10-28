import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";
import { requireCapability } from "@/lib/auth/actor";

export const metadata: Metadata = {
  title: "Entitlement",
};

export default async function Page() {
  // Guard per halaman: layout tidak menghentikan render segmen lain, jadi
  // otorisasi tidak boleh bergantung pada layout (09-superadmin-admin.md 8).
  await requireCapability("entitlement:grant");

  return (
    <RouteStub
      title="Entitlement"
      description="Pencarian akses berdasarkan email, slug, atau nomor pesanan; grant dan revoke tercatat di audit."
      requirement="FR-ADM-01..20"
      milestone="M5"
      capability="entitlement:grant"
      size="wide"
    />
  );
}
