import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { AdGateCountdown } from "@/components/download/ad-gate-countdown";
import { FileSizeNotice } from "@/components/download/file-size-notice";
import { Container } from "@/components/layout/container";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui-ext/badge";
import { Button } from "@/components/ui-ext/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getDownloadItem } from "@/lib/downloads/access";
import { GATE_COOKIE, gateRemainingSeconds } from "@/lib/downloads/gate";
import { getInterstitialSeconds, getAdsEnabled } from "@/lib/settings";
import { getStorage } from "@/lib/storage";

export const metadata: Metadata = {
  title: "Unduhan gratis",
  robots: { index: false, follow: false },
};

/**
 * Halaman interstisial memakai `params`, `searchParams`, dan `cookies()`,
 * sehingga kontennya dirender di dalam `<Suspense>` (Cache Components) dan
 * shell tetap bisa diprerender. `dl_gate` sendiri dipasang proxy — Server
 * Component tidak boleh menulis cookie.
 */
export const instant = false;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; wait?: string }>;
};

const ERROR_TITLE: Record<string, string> = {
  ad_gate_required: "Gerbang iklan belum selesai",
  rate_limited: "Batas unduhan tercapai",
  no_entitlement: "Item ini perlu dibeli",
  validation_failed: "Permintaan unduhan tidak sesuai",
  not_found: "Source code tidak ditemukan",
};

function errorMessage(code: string, wait: string | undefined): string {
  switch (code) {
    case "ad_gate_required":
      return "Muat ulang halaman ini, tunggu hitung mundur selesai, lalu tekan Lanjut unduh sekali lagi.";
    case "rate_limited": {
      const duration = waitText(wait);
      return duration
        ? `Batas unduhan per 24 jam untuk item ini sudah tercapai. Coba lagi dalam ${duration}.`
        : "Batas unduhan per 24 jam untuk item ini sudah tercapai. Coba lagi nanti.";
    }
    case "no_entitlement":
      return "Item premium hanya bisa diunduh setelah pembelian dikonfirmasi.";
    case "validation_failed":
      return "Permintaan tidak sesuai. Buka ulang halaman item lalu pilih jalur unduhan yang benar.";
    default:
      return "Unduhan belum bisa dimulai. Coba lagi, atau hubungi kami bila masalah berlanjut.";
  }
}

function waitText(raw: string | undefined): string | null {
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  if (seconds >= 3600) return `${Math.ceil(seconds / 3600)} jam`;
  if (seconds >= 60) return `${Math.ceil(seconds / 60)} menit`;
  return `${Math.ceil(seconds)} detik`;
}

export default function Page({ params, searchParams }: PageProps) {
  return (
    <Container size="prose" className="py-12">
      <Suspense fallback={<AdsSkeleton />}>
        <AdsContent params={params} searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function AdsContent({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { error, wait } = await searchParams;

  const item = await getDownloadItem(slug);

  // Proxy sudah menegakkan 404/410 sebelum render; ini jaring pengaman bila
  // halaman dipanggil lewat jalur lain.
  if (!item || item.deleted || item.status !== "PUBLISHED") notFound();
  if (item.type !== "FREE") redirect(`/source-code/${item.slug}?beli=1`);

  const adsEnabled = await getAdsEnabled();
  const seconds = await getInterstitialSeconds();
  const remaining = adsEnabled
    ? gateRemainingSeconds((await cookies()).get(GATE_COOKIE)?.value, item.slug, seconds)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Badge tone="free">Unduhan gratis</Badge>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{item.title}</h1>
        <p className="text-base text-muted-foreground">
          {adsEnabled
            ? "Iklan membantu source code ini tetap gratis. Setelah hitung mundur selesai, tautan unduhan berlaku 5 menit dan hanya dapat dipakai sekali."
            : "Iklan sedang dinonaktifkan, jadi tautan unduhan dapat diterbitkan langsung. Tautan berlaku 5 menit dan hanya dapat dipakai sekali."}
        </p>
      </div>

      {adsEnabled ? (
        <AdSlot />
      ) : (
        <Alert role="note">
          <AlertTitle>Tanpa interstisial</AlertTitle>
          <AlertDescription>
            <p>Admin mematikan halaman iklan sementara. Tidak ada hitung mundur yang perlu ditunggu.</p>
          </AlertDescription>
        </Alert>
      )}

      <FileSizeNotice sizeBytes={item.fileSize} resumable={getStorage().supportsRange} />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>{ERROR_TITLE[error] ?? "Unduhan belum bisa dimulai"}</AlertTitle>
          <AlertDescription>
            <p>{errorMessage(error, wait)}</p>
          </AlertDescription>
        </Alert>
      ) : null}

      {adsEnabled ? (
        <AdGateCountdown slug={item.slug} seconds={seconds} remaining={remaining} />
      ) : (
        <form
          method="post"
          action={`/api/download/${encodeURIComponent(item.slug)}/token`}
          className="flex w-full flex-col gap-3"
        >
          <input type="hidden" name="purpose" value="FREE_AD" />
          <Button type="submit" size="lg" fullWidth>
            Unduh sekarang
          </Button>
        </form>
      )}

      <p className="text-xs text-muted-foreground">
        {adsEnabled
          ? "Tautan unduhan diterbitkan server setelah gerbang iklan terlewati."
          : "Tautan unduhan diterbitkan langsung oleh server."}{" "}
        <Link
          href={`/source-code/${item.slug}`}
          className="font-medium underline underline-offset-4 hover:text-foreground focus-ring"
        >
          Kembali ke halaman item
        </Link>
      </p>
    </div>
  );
}

/**
 * Slot iklan interstisial. Sampai admin M3 mengisi data sponsor, slot ini
 * menampilkan label jujur bahwa ruangnya tersedia — bukan iklan palsu.
 */
function AdSlot() {
  return (
    <aside
      aria-label="Iklan"
      className="flex flex-col gap-2 rounded-lg border border-dashed border-border-strong bg-muted/40 p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Iklan</p>
      <p className="text-sm text-muted-foreground">
        Slot iklan ini tersedia untuk produk developer dan jasa yang relevan.
      </p>
      <Link
        href="/kontak"
        className="w-fit text-sm font-medium underline underline-offset-4 hover:text-muted-foreground focus-ring"
      >
        Pasang iklan
      </Link>
    </aside>
  );
}

function AdsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <Skeleton className="h-6 w-28" />
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
