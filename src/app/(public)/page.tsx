import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, FileCode2, ShieldCheck } from "lucide-react";

import { ItemCard } from "@/components/catalog/item-card";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui-ext/badge";
import { Button } from "@/components/ui-ext/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCatalogCategories, getFeaturedItems } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Source code siap pakai untuk developer Indonesia",
  description:
    "Katalog source code siap pakai: unduh gratis lewat halaman iklan, atau beli tanpa iklan dan dapatkan riwayat unduhan beserta invoice.",
  alternates: { canonical: "/" },
};

const highlights = [
  {
    icon: FileCode2,
    title: "Katalog terkurasi",
    body: "Aplikasi POS, LMS, booking, dan lainnya — lengkap dengan teknologi dan lisensi.",
  },
  {
    icon: Download,
    title: "Dua jalur unduhan",
    body: "Gratis lewat halaman iklan, atau bayar sekali untuk unduh tanpa iklan.",
  },
  {
    icon: ShieldCheck,
    title: "Berkas aman",
    body: "Semua berkas dialirkan lewat server. Tautan penyimpanan tidak pernah terekspos.",
  },
];

/**
 * S01 beranda — `05-ux-flows.md` S01: hero, item unggulan, kategori.
 * Data unggulan di-cache 60 detik (`12-route-map.md`), jadi halaman ini bisa
 * diprerender dan tetap segar setelah konten baru diterbitkan.
 */
export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedItems(3),
    getCatalogCategories(),
  ]);

  return (
    <>
      <section className="border-b border-border">
        <Container className="py-16 sm:py-24">
          <Badge tone="free" className="mb-6">
            Katalog source code
          </Badge>
          <h1 className="max-w-[22ch] text-4xl font-semibold tracking-tight sm:text-5xl">
            Source code siap pakai, tanpa basa-basi.
          </h1>
          <p className="mt-4 max-w-prose text-lg text-muted-foreground">
            Unduh gratis lewat iklan, atau beli tanpa iklan dan dapatkan riwayat unduhan
            beserta invoice. Semua berkas berasal dari pemiliknya.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/source-code">
                Jelajahi katalog
                <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/tutorial">Baca tutorial</Link>
            </Button>
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Item unggulan</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pilihan yang paling sering diunduh pengunjung Reditech.
            </p>
          </div>
          <Link
            href="/source-code"
            className="text-sm font-medium underline underline-offset-4 hover:text-muted-foreground focus-ring"
          >
            Lihat semua
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border-strong bg-card px-6 py-12 text-center">
            <p className="text-base font-semibold">Belum ada item unggulan.</p>
            <p className="mx-auto mt-2 max-w-prose text-sm text-muted-foreground">
              Katalog masih diisi. Semua item yang sudah terbit tetap bisa dijelajahi
              lewat katalog.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/source-code">Buka katalog</Link>
              </Button>
            </div>
          </div>
        ) : (
          <ul className="mt-6 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <li key={item.slug}>
                <ItemCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </Container>

      <section className="border-y border-border bg-sidebar">
        <Container className="py-12">
          <h2 className="text-2xl font-semibold tracking-tight">Kategori</h2>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            Mulai dari jenis aplikasi yang Anda butuhkan; filter kategori bisa digabung
            dengan pencarian dan tipe.
          </p>
          <ul className="mt-6 flex list-none flex-wrap gap-2">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/source-code?kategori=${category.slug}`}
                  className="inline-flex items-center rounded-full border border-border-strong px-3 py-1.5 text-sm text-foreground hover:bg-muted focus-ring"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Container className="py-16">
        <h2 className="text-2xl font-semibold">Kenapa Reditech</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <item.icon className="size-6" aria-hidden="true" />
                <CardTitle className="mt-2">{item.title}</CardTitle>
                <CardDescription>{item.body}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
}
