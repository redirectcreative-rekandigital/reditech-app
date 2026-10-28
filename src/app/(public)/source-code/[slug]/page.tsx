import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Detail source code",
};

/**
 * Rute ini memakai `params`, sehingga tidak bisa dirender sebagai shell statis.
 * M1 menggantinya dengan <Suspense> + skeleton agar navigasi tetap instan.
 */
export const instant = false;

type PageProps = { params: Promise<{ slug: string }> };

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  return (
    <RouteStub
      screen="S03"
      title="Detail source code"
      description="Halaman detail item: galeri, deskripsi, metadata teknis, dan panel unduhan dua jalur."
      requirement="FR-ITEM-01..09"
      milestone="M1"
      params={{ slug }}
    />
  );
}
