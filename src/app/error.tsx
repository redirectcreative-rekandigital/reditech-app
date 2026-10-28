"use client";

import { useEffect } from "react";

import Link from "next/link";

import { Button } from "@/components/ui-ext/button";
import { Container } from "@/components/layout/container";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // M7: kirim ke logger terstruktur, bukan console.
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-dvh max-w-prose flex-col items-start justify-center py-16">
      <p className="font-mono text-sm text-muted-foreground">500</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Ada yang gagal di server</h1>
      <p className="mt-3 text-base text-muted-foreground">
        Permintaan ini tidak selesai. Coba lagi; bila tetap gagal, sertakan kode kejadian di
        bawah saat menghubungi kami.
      </p>
      {error.digest ? (
        <p className="mt-4 font-mono text-[13px] text-muted-foreground">
          Kode kejadian: {error.digest}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={reset}>Coba lagi</Button>
        <Button asChild variant="outline">
          <Link href="/">Ke beranda</Link>
        </Button>
      </div>
    </Container>
  );
}
