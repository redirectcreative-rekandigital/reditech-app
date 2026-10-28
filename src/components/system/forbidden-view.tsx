import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui-ext/button";

/**
 * Satu-satunya tampilan `403`. Dipakai dua jalur:
 *
 * 1. proxy mengirim HTML `/403` dengan status `403` (jalur utama, sebelum shell
 *    PPR terkirim);
 * 2. `forbidden()` di dalam render sebagai jaring pengaman bila hak akses
 *    berubah di tengah sesi.
 *
 * Pengunjung anonim sudah dialihkan ke `/login` oleh proxy, jadi halaman ini
 * tidak menawarkan "masuk lagi" seolah sesi tidak ada.
 */
export function ForbiddenView() {
  return (
    <Container size="prose" className="flex flex-col items-start py-16">
      <p className="font-mono text-sm text-muted-foreground">403</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Tidak punya akses</h1>
      <p className="mt-3 text-base text-muted-foreground">
        Akun ini tidak memiliki izin membuka panel pengelola. Bila Anda seharusnya menjadi
        admin, hubungi pemilik situs untuk menambahkan kapabilitas yang sesuai.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/">Ke beranda</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/source-code">Jelajahi katalog</Link>
        </Button>
      </div>
    </Container>
  );
}
