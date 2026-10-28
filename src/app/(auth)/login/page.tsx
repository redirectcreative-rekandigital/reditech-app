import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getActor } from "@/lib/auth/actor";
import { safeRedirect } from "@/lib/auth/redirect";

export const instant = false;

export const metadata: Metadata = {
  title: "Masuk",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const actor = await getActor();
  if (actor) redirect(actor.mfaEnabled ? "/admin" : "/admin/mfa");

  const { redirect: redirectTo } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Masuk ke panel</h1>
        <p className="text-sm text-muted-foreground">
          Halaman ini khusus pengelola situs. Akun pembeli dan unduhan masuk lewat akun Google.
        </p>
      </div>

      <LoginForm redirectTo={safeRedirect(redirectTo)} />

      <p className="text-sm text-muted-foreground">
        Lupa kata sandi? Hubungi pemilik situs untuk mengatur ulang akses.
      </p>
    </div>
  );
}
