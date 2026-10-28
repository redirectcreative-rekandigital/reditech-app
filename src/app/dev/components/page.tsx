import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CircleCheck, Clock, Download, Plus, Sparkles, Trash2 } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui-ext/badge";
import { Button } from "@/components/ui-ext/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Pratinjau komponen",
  robots: { index: false, follow: false },
};

const buttonVariants = [
  { variant: "primary", label: "Download Tanpa Iklan" },
  { variant: "secondary", label: "Kirim Request" },
  { variant: "outline", label: "Download Gratis" },
  { variant: "ghost", label: "Batal" },
  { variant: "destructive", label: "Hapus permanen" },
  { variant: "destructiveOutline", label: "Cabut akses" },
] as const;

const badgeTones = [
  { tone: "premium", label: "Premium", icon: Sparkles },
  { tone: "free", label: "Gratis", icon: null },
  { tone: "neutral", label: "Draf", icon: null },
  { tone: "success", label: "Terbit", icon: CircleCheck },
  { tone: "warning", label: "Menunggu", icon: Clock },
  { tone: "danger", label: "Gagal", icon: null },
] as const;

export default function ComponentsPreviewPage() {
  // Halaman ini hanya untuk pengembangan; tidak pernah ikut produksi.
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <Container className="space-y-12 py-12">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Pratinjau komponen</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Halaman internal untuk memeriksa token Celestial dan varian komponen tanpa
          Storybook. Tidak diindeks dan tidak tersedia di produksi.
        </p>
      </header>

      <section aria-labelledby="tombol">
        <h2 id="tombol" className="text-2xl font-semibold">
          Button
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {buttonVariants.map((item) => (
            <Button key={item.variant} variant={item.variant}>
              {item.label}
            </Button>
          ))}
          <Button loading>Menyimpan</Button>
          <Button variant="outline" iconLeft={Download}>
            Unduh
          </Button>
          <Button variant="outline" size="sm" iconRight={Plus}>
            Tambah
          </Button>
          <Button disabled>Nonaktif</Button>
          <Button variant="destructiveOutline" iconLeft={Trash2}>
            Refund
          </Button>
        </div>
      </section>

      <section aria-labelledby="badge">
        <h2 id="badge" className="text-2xl font-semibold">
          Badge
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {badgeTones.map((item) => {
            const Icon = item.icon;
            return (
              <Badge key={item.tone} tone={item.tone}>
                {Icon ? <Icon aria-hidden="true" /> : null}
                {item.label}
              </Badge>
            );
          })}
        </div>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          `success` dan `warning` berbagi latar; pembeda selalu ikon + kata.
        </p>
      </section>

      <section aria-labelledby="form">
        <h2 id="form" className="text-2xl font-semibold">
          Field
        </h2>
        <div className="mt-4 grid max-w-md gap-4">
          <div className="grid gap-2">
            <Label htmlFor="demo-email">Email</Label>
            <Input id="demo-email" type="email" placeholder="nama@contoh.id" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="demo-error">Slug</Label>
            <Input id="demo-error" aria-invalid defaultValue="POS KASIR" />
            <p className="text-sm text-foreground">
              <span aria-hidden="true" className="text-destructive">
                ●{" "}
              </span>
              Slug hanya boleh huruf kecil dan tanda hubung.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="demo-disabled">Email akun</Label>
            <Input id="demo-disabled" disabled defaultValue="pembeli@contoh.id" />
            <p className="text-sm text-muted-foreground">
              Email tidak dapat diubah karena terhubung ke Google.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="kartu">
        <h2 id="kartu" className="text-2xl font-semibold">
          Card & Alert
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Aplikasi POS Laravel</CardTitle>
              <CardDescription>Laravel 11 · MySQL · Lisensi MIT</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Badge tone="premium">
                <Sparkles aria-hidden="true" />
                Premium
              </Badge>
              <Badge tone="free">Demo tersedia</Badge>
            </CardContent>
          </Card>

          <Alert>
            <AlertTitle>Berkas 68 MB</AlertTitle>
            <AlertDescription>
              Unduhan tidak dapat dilanjutkan bila koneksi terputus. Sisakan ruang dan waktu
              yang cukup.
            </AlertDescription>
          </Alert>
        </div>
      </section>
    </Container>
  );
}
