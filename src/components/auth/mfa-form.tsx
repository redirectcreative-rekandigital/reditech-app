"use client";

import { useActionState } from "react";

import { verifyMfaAction, type AuthFormState } from "@/app/(auth)/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui-ext/button";

const initialState: AuthFormState = {};

export function MfaForm({ redirectTo }: { redirectTo: string }) {
  const [state, action, pending] = useActionState(verifyMfaAction, initialState);
  const codeError = state.fieldErrors?.code?.[0];

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Kode verifikasi</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
          placeholder="123456 atau ABCD-EFGH"
          aria-invalid={codeError ? true : undefined}
          aria-describedby={codeError ? "code-error" : "code-hint"}
        />
        <p id="code-hint" className="text-sm text-muted-foreground">
          Masukkan 6 digit dari aplikasi authenticator, atau salah satu kode pemulihan.
        </p>
        {codeError ? (
          <p id="code-error" className="text-sm text-destructive">
            {codeError}
          </p>
        ) : null}
      </div>

      <Button type="submit" fullWidth loading={pending} disabled={pending}>
        Verifikasi
      </Button>
    </form>
  );
}
