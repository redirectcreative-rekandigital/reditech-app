import type { Metadata } from "next";
import QRCode from "qrcode";

import { startEnrollmentAction } from "@/app/(auth)/actions";
import { DisableMfaForm } from "@/components/auth/disable-mfa-form";
import { EnrollConfirmForm } from "@/components/auth/enroll-confirm-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui-ext/badge";
import { Button } from "@/components/ui-ext/button";
import { requireAdminRole } from "@/lib/auth/actor";
import { getPendingSecret } from "@/lib/auth/mfa";
import { otpauthUrl } from "@/lib/auth/totp";
import { prisma } from "@/lib/prisma";

// Membaca cookie sesi di luar Suspense (gerbang MFA), jadi tidak boleh
// diprerender sebagai shell statis.
export const instant = false;

export const metadata: Metadata = {
  title: "Keamanan akun",
  robots: { index: false, follow: false },
};

function groupSecret(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

export default async function MfaPage() {
  const actor = await requireAdminRole();
  const user = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { mfaEnabled: true, mfaRecoveryEnc: true },
  });

  if (user?.mfaEnabled) {
    return (
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Keamanan akun</h1>
            <Badge tone="success">MFA aktif</Badge>
          </div>
          <p className="max-w-prose text-sm text-muted-foreground">
            Setiap login meminta kode dari aplikasi authenticator. Tersisa{" "}
            <strong>{user.mfaRecoveryEnc.length}</strong> kode pemulihan yang belum dipakai.
          </p>
        </header>

        <section className="rounded-lg border border-border bg-background p-6">
          <h2 className="text-lg font-semibold">Nonaktifkan MFA</h2>
          <p className="mt-1 mb-4 max-w-prose text-sm text-muted-foreground">
            Panel akan mengunci semua halaman sampai MFA didaftarkan kembali. Semua sesi lain
            dicabut seketika.
          </p>
          <DisableMfaForm />
        </section>
      </div>
    );
  }

  const secret = await getPendingSecret(actor.id);

  if (!secret) {
    return (
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Keamanan akun</h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            MFA belum aktif. Tanpa MFA, panel hanya bisa dibuka sampai halaman ini — konten tidak
            dapat dikelola sebelum faktor kedua terpasang.
          </p>
        </header>

        <form action={startEnrollmentAction}>
          <Button type="submit">Mulai pendaftaran MFA</Button>
        </form>
      </div>
    );
  }

  const qrDataUrl = await QRCode.toDataURL(otpauthUrl(secret, actor.email), {
    margin: 1,
    width: 240,
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Daftarkan authenticator</h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          Pindai kode QR dengan aplikasi authenticator (Google Authenticator, 1Password, Authy),
          lalu masukkan 6 digit yang muncul.
        </p>
      </header>

      <div className="grid gap-6 rounded-lg border border-border bg-background p-6 sm:grid-cols-[auto_minmax(0,1fr)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL, bukan aset optimizer */}
        <img
          src={qrDataUrl}
          alt="Kode QR untuk mendaftarkan authenticator"
          width={240}
          height={240}
          className="rounded-md border border-border bg-white p-2"
        />
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium">Tidak bisa memindai?</p>
            <p className="text-sm text-muted-foreground">
              Masukkan kunci ini secara manual di aplikasi authenticator:
            </p>
          </div>
          <p className="rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm break-all">
            {groupSecret(secret)}
          </p>
          <Alert>
            <AlertTitle>Rahasia ini hanya untuk akunmu</AlertTitle>
            <AlertDescription>
              Jangan bagikan kunci ini. Setelah aktif, kamu akan menerima 10 kode pemulihan.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <section className="max-w-md">
        <EnrollConfirmForm />
      </section>
    </div>
  );
}
