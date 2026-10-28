import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Detail pengguna",
};

/**
 * Rute ini memakai `params`, sehingga tidak bisa dirender sebagai shell statis.
 * M1 menggantinya dengan <Suspense> + skeleton agar navigasi tetap instan.
 */
export const instant = false;

type PageProps = { params: Promise<{ id: string }> };

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return (
    <RouteStub
      screen="S26"
      title="Detail pengguna"
      description="Profil pengguna, sesi aktif, pesanan, unduhan, dan kapabilitas efektif."
      requirement="FR-ADM-01..20"
      milestone="M4"
      capability="user:read"
      size="wide"
      params={{ id }}
    />
  );
}
