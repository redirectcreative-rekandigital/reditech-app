import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Detail tutorial",
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
      title="Detail tutorial"
      description="Edit artikel tutorial, riwayat revisi, dan kendali publikasi."
      requirement="FR-ADM-01..20"
      milestone="M6"
      capability="tutorial:read"
      size="wide"
      params={{ id }}
    />
  );
}
