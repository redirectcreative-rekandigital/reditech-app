import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui-ext/button";

export const metadata: Metadata = {
  title: "Item tidak lagi tersedia",
  description:
    "Source code ini sudah diarsipkan dan tidak lagi dibagikan. Lihat katalog untuk item lain yang tersedia.",
  robots: { index: false, follow: false },
};

/**
 * `410 Gone` — FR-ITEM-08/09.
 * Tidak dialihkan ke item lain: pengunjung harus tahu itemnya benar-benar
 * ditarik, bukan dipindahkan.
 *
 * Status 410 dipasang oleh proxy: Next menghormati `rewrite(..., { status })`
 * hanya bila targetnya tidak dilayani dari cache statis — halaman ini
 * diprerender, jadi proxy mengambil HTML-nya lalu mengirim ulang dengan
 * status 410. Lihat `12-route-map.md` 12.
 */
export default function Page() {
  return (
    <Container size="prose" className="flex flex-col items-start py-16">
      <p className="font-mono text-sm text-muted-foreground">410</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Item ini tidak lagi tersedia
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        Source code yang Anda cari sudah diarsipkan oleh pemiliknya. Halaman ini tidak
        dialihkan ke item lain supaya tidak menyesatkan; katalog selalu memuat item yang
        masih aktif.
      </p>
      <p className="mt-3 text-base text-muted-foreground">
        Bila Anda pernah membelinya, riwayat pembelian tetap tersimpan di akun Anda.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/source-code">Jelajahi katalog</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/kontak">Hubungi kami</Link>
        </Button>
      </div>
    </Container>
  );
}
