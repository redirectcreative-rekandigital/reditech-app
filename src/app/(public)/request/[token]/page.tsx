import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Status usulan aplikasi",
  robots: { index: false, follow: false },
};

/**
 * Rute ini memakai `params`, sehingga tidak bisa dirender sebagai shell statis.
 * M1 menggantinya dengan <Suspense> + skeleton agar navigasi tetap instan.
 */
export const instant = false;

type PageProps = { params: Promise<{ token: string }> };

export default async function Page({ params }: PageProps) {
  const { token } = await params;

  return (
    <RouteStub
      screen="S10"
      title="Status usulan aplikasi"
      description="Halaman status usulan yang dapat dibuka lewat token bertanda tangan tanpa login."
      requirement="FR-CMS-05"
      milestone="M6"
      params={{ token }}
    />
  );
}
