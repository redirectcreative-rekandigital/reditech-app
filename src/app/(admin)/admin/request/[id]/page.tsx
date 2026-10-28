import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";
import { requireCapability } from "@/lib/auth/actor";

export const metadata: Metadata = {
  title: "Detail usulan",
};

/**
 * Rute ini memakai `params`, sehingga tidak bisa dirender sebagai shell statis.
 * M1 menggantinya dengan <Suspense> + skeleton agar navigasi tetap instan.
 */
export const instant = false;

type PageProps = { params: Promise<{ id: string }> };

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  // Guard per halaman: layout tidak menghentikan render segmen lain, jadi
  // otorisasi tidak boleh bergantung pada layout (09-superadmin-admin.md 8).
  await requireCapability("request:read");


  return (
    <RouteStub
      title="Detail usulan"
      description="Detail usulan, perubahan status, dan catatan publik untuk pengusul."
      requirement="FR-ADM-01..20"
      milestone="M6"
      capability="request:read"
      size="wide"
      params={{ id }}
    />
  );
}
