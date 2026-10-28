import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Unduhan gratis lewat iklan",
  robots: { index: false, follow: false },
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
      screen="S04"
      title="Unduhan gratis lewat iklan"
      description="Interstisial hitung mundur sebelum berkas gratis dapat diunduh, dengan pengaturan cookie gerbang unduhan."
      requirement="FR-DL-02..03"
      milestone="M2"
      params={{ slug }}
    />
  );
}
