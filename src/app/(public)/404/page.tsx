import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui-ext/button";

export const metadata: Metadata = {
  title: "Item tidak ditemukan",
  description:
    "Source code yang Anda cari tidak ada atau belum diterbitkan. Lihat katalog untuk item yang tersedia.",
  robots: { index: false, follow: false },
};

/**
 * Sasaran rewrite proxy untuk item yang tidak ada/draf, dengan status 404.
 * Alasannya sama dengan `/410`: status harus ditentukan sebelum render.
 */
export default function Page() {
  return (
    <Container size="prose" className="flex flex-col items-start py-16">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Item ini tidak ditemukan
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        Alamatnya salah ketik, atau item belum diterbitkan. Item yang pernah terbit lalu
        ditarik memakai status 410, bukan 404.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/source-code">Jelajahi katalog</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Ke beranda</Link>
        </Button>
      </div>
    </Container>
  );
}
