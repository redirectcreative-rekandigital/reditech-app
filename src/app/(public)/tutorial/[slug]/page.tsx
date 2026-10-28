import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Artikel tutorial",
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
      screen="S08"
      title="Artikel tutorial"
      description="Artikel tutorial dengan prose Georgia, daftar isi, dan blok kode Menlo."
      requirement="FR-CMS-01..02"
      milestone="M6"
      params={{ slug }}
    />
  );
}
