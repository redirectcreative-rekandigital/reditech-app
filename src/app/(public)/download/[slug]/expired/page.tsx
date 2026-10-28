import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui-ext/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getDownloadItem } from "@/lib/downloads/access";
import { TOKEN_TTL_MINUTES } from "@/lib/downloads/tokens";

export const metadata: Metadata = {
  title: "Tautan unduhan kedaluwarsa",
  description:
    "Tautan unduhan Reditech hanya berlaku beberapa menit dan sekali pakai. Minta tautan baru dari halaman item.",
  robots: { index: false, follow: false },
};

/**
 * Halaman 410 untuk token kedaluwarsa/terpakai (FR-DL-04). Route handler
 * berkas mengambil HTML halaman ini lalu mengirimnya dengan status 410, karena
 * Next tidak punya API halaman untuk status itu (`12-route-map.md` 12).
 */
export const instant = false;

type PageProps = { params: Promise<{ slug: string }> };

export default function Page({ params }: PageProps) {
  return (
    <Container size="prose" className="py-16">
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <ExpiredContent params={params} />
      </Suspense>
    </Container>
  );
}

async function ExpiredContent({ params }: PageProps) {
  const { slug } = await params;
  const item = await getDownloadItem(slug);
  const usable = item !== null && !item.deleted && item.status === "PUBLISHED";

  return (
    <div className="flex flex-col items-start">
      <p className="font-mono text-sm text-muted-foreground">410</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Tautan unduhan sudah kedaluwarsa
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        Tautan unduhan hanya berlaku {TOKEN_TTL_MINUTES} menit dan dapat dipakai sekali
        {usable ? ` untuk ${item.title}` : ""}. Tautan lama tidak bisa diaktifkan kembali, tetapi
        Anda dapat meminta tautan baru tanpa mengulang dari awal.
      </p>
      <p className="mt-3 text-base text-muted-foreground">
        Bila unduhan terputus di tengah jalan, mulai ulang dari halaman iklan — berkas dikirim
        sebagai satu aliran penuh dan tidak dapat dilanjutkan.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          {/* Route handler, bukan halaman: jangan pakai <Link>. */}
          <a href={`/api/download/${encodeURIComponent(slug)}`}>Minta tautan baru</a>
        </Button>
        {usable ? (
          <Button asChild variant="outline">
            <Link href={`/source-code/${item.slug}`}>Kembali ke halaman item</Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/source-code">Jelajahi katalog</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
