import Link from "next/link";

import { Button } from "@/components/ui-ext/button";
import { Container } from "@/components/layout/container";

export default function NotFound() {
  return (
    <Container className="flex min-h-dvh max-w-prose flex-col items-start justify-center py-16">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Halaman tidak ditemukan</h1>
      <p className="mt-3 text-base text-muted-foreground">
        Alamat ini tidak ada, sudah dipindahkan, atau tidak pernah tersedia. Item yang
        diarsipkan memakai status 410, bukan 404.
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
