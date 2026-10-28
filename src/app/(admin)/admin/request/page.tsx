import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";
import { requireCapability } from "@/lib/auth/actor";

export const metadata: Metadata = {
  title: "Usulan aplikasi",
};

export default async function Page() {
  // Guard per halaman: layout tidak menghentikan render segmen lain, jadi
  // otorisasi tidak boleh bergantung pada layout (09-superadmin-admin.md 8).
  await requireCapability("request:read");

  return (
    <RouteStub
      title="Usulan aplikasi"
      description="Pipeline usulan aplikasi dari masuk sampai dijawab."
      requirement="FR-ADM-01..20"
      milestone="M6"
      capability="request:read"
      size="wide"
    />
  );
}
