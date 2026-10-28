"use client";

import { useActionState } from "react";

import { confirmEnrollmentAction, type AuthFormState } from "@/app/(auth)/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui-ext/button";

const initialState: AuthFormState = {};

export function EnrollConfirmForm() {
  const [state, action, pending] = useActionState(confirmEnrollmentAction, initialState);

  if (state.recoveryCodes?.length) {
    return (
      <div className="flex flex-col gap-4">
        <Alert>
          <AlertDescription>
            MFA aktif. Simpan kode pemulihan ini sekarang — kode hanya ditampilkan sekali.
          </AlertDescription>
        </Alert>
        <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
          {state.recoveryCodes.map((code) => (
            <li key={code} className="rounded-md border border-border bg-muted px-3 py-2">
              {code}
            </li>
          ))}
        </ul>
        {/* Sengaja `<a>`, bukan `<Link>`: sebelum MFA aktif, prefetch `/admin`
            menghasilkan 307 ke halaman enrol, dan entri prefetch itu masih ada
            di router cache saat tombol diklik. Muat ulang penuh membuang cache
            tersebut sehingga panel terbuka dengan status otorisasi terbaru. */}
        <Button asChild fullWidth>
          <a href="/admin">Lanjut ke panel</a>
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Kode dari authenticator</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          required
        />
      </div>

      <Button type="submit" fullWidth loading={pending} disabled={pending}>
        Aktifkan MFA
      </Button>
    </form>
  );
}
