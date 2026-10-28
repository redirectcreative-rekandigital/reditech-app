"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui-ext/button";
import { Progress } from "@/components/ui/progress";

/**
 * `AdGateCountdown` — `11-component-inventory.md` 8, FR-DL-03.
 *
 * Hitung mundur dihitung server dari cookie `dl_gate` (`remaining`), jadi
 * memuat ulang halaman tidak mengulang waktu dan pengguna tanpa JavaScript
 * cukup memuat ulang setelah hitung mundur selesai untuk mendapat tombol aktif.
 * Angka detik disembunyikan dari pembaca layar (`aria-hidden`); status
 * diumumkan sekali lewat `role="status"` saat tombol siap.
 */
export function AdGateCountdown({
  slug,
  seconds,
  remaining,
}: {
  slug: string;
  seconds: number;
  remaining: number;
}) {
  const total = Math.max(1, seconds);
  const [left, setLeft] = useState(() => Math.min(total, Math.max(0, remaining)));

  useEffect(() => {
    if (left <= 0) return;

    const timer = window.setTimeout(() => {
      setLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [left]);

  const ready = left <= 0;
  const progress = ((total - left) / total) * 100;

  return (
    <form
      method="post"
      action={`/api/download/${encodeURIComponent(slug)}/token`}
      className="flex w-full flex-col gap-4"
    >
      <input type="hidden" name="purpose" value="FREE_AD" />

      <Progress value={progress} aria-hidden="true" />

      <p aria-hidden="true" className="text-sm text-muted-foreground">
        {ready ? "Hitung mundur selesai." : `Tombol unduh aktif dalam ${left} detik.`}
      </p>

      <p role="status" aria-live="polite" className="sr-only">
        {ready
          ? "Hitung mundur selesai. Tombol Lanjut unduh sudah aktif."
          : "Hitung mundur berjalan. Tombol Lanjut unduh aktif setelah hitung mundur selesai."}
      </p>

      <Button type="submit" size="lg" fullWidth disabled={!ready}>
        Lanjut unduh
      </Button>

      <noscript>
        <p className="text-xs text-muted-foreground">
          JavaScript nonaktif: muat ulang halaman ini setelah hitung mundur selesai, lalu tombol
          Lanjut unduh otomatis aktif.
        </p>
      </noscript>
    </form>
  );
}
