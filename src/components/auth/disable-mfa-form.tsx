"use client";

import { useActionState } from "react";

import { disableMfaAction, type DisableMfaState } from "@/app/(admin)/admin/mfa/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui-ext/button";

const initialState: DisableMfaState = {};

export function DisableMfaForm() {
  const [state, action, pending] = useActionState(disableMfaAction, initialState);

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="disable-code">Kode authenticator</Label>
        <Input id="disable-code" name="code" inputMode="numeric" autoComplete="one-time-code" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="disable-confirm">Ketik NONAKTIFKAN</Label>
        <Input id="disable-confirm" name="confirm" required />
      </div>

      <Button type="submit" variant="destructive" loading={pending} disabled={pending}>
        Nonaktifkan MFA
      </Button>
    </form>
  );
}
