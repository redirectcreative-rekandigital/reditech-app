import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";
import { requireCapability } from "@/lib/auth/actor";

export const metadata: Metadata = {
  title: "Detail item",
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
  await requireCapability("item:read");


  return (
    <RouteStub
      screen="S23"
      title="Detail item"
      description="Editor item yang sudah ada beserta riwayat revisi dan pemeriksaan gerbang publikasi."
      requirement="FR-ADM-01..20"
      milestone="M3"
      capability="item:read"
      size="wide"
      params={{ id }}
    />
  );
}
