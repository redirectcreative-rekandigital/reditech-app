import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, FileCode2, ShieldCheck } from "lucide-react";

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

export const metadata: Metadata = {
  title: "Source code siap pakai untuk developer Indonesia",
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

export default function HomePage() {
  return (
    <>
      <section className="border-b border-border">
        <Container className="py-16 sm:py-24">
          <Badge tone="free" className="mb-6">
            M0 — fondasi
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
