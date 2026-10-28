import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";
import { requireCapability } from "@/lib/auth/actor";

export const metadata: Metadata = {
  title: "Pengguna",
};

export default async function Page() {
  // Guard per halaman: layout tidak menghentikan render segmen lain, jadi
  // otorisasi tidak boleh bergantung pada layout (09-superadmin-admin.md 8).
  await requireCapability("user:read");

  return (
    <RouteStub
      screen="S26"
      title="Pengguna"
      description="Daftar pengguna, penetapan peran, dan penangguhan akun."
      requirement="FR-ADM-01..20"
      milestone="M4"
      capability="user:read"
      size="wide"
    />
  );
}
