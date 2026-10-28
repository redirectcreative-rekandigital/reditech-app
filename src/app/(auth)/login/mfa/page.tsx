import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { MfaForm } from "@/components/auth/mfa-form";
import { getActor } from "@/lib/auth/actor";
import { MFA_CHALLENGE_COOKIE, readMfaChallenge } from "@/lib/auth/mfa";
import { safeRedirect } from "@/lib/auth/redirect";

export const instant = false;

export const metadata: Metadata = {
  title: "Verifikasi dua langkah",
  robots: { index: false, follow: false },
};

export default async function MfaPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  // `readMfaChallenge()` membandingkan kedaluwarsa dengan `Date.now()`. Nilai
  // itu tidak stabil saat prerender, jadi render ditahan sampai ada permintaan
  // sungguhan — sekaligus memastikan cookie dibaca per permintaan.
  await connection();

  const challenge = readMfaChallenge((await cookies()).get(MFA_CHALLENGE_COOKIE)?.value);

  if (!challenge) {
    redirect(
      `/login?redirect=${encodeURIComponent(safeRedirect((await searchParams).redirect))}`,
    );
  }

  // Sudah punya sesi penuh: tidak perlu verifikasi ulang.
  const actor = await getActor();
  if (actor?.mfaEnabled) redirect("/admin");

  const { redirect: redirectTo } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Verifikasi dua langkah</h1>
        <p className="text-sm text-muted-foreground">
          Kata sandi benar. Masukkan kode dari aplikasi authenticator untuk melanjutkan.
        </p>
      </div>

      <MfaForm redirectTo={safeRedirect(redirectTo)} />

      <p className="text-sm text-muted-foreground">
        Tantangan ini berlaku 5 menit. Bila sudah lewat, kembali ke{" "}
        <a className="underline underline-offset-4" href="/login">
          halaman masuk
        </a>
        .
      </p>
    </div>
  );
}
