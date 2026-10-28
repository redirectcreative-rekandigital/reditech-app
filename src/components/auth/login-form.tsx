"use client";

import { useActionState } from "react";

import { loginAction, type AuthFormState } from "@/app/(auth)/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui-ext/button";

const initialState: AuthFormState = {};

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const emailError = state.fieldErrors?.email?.[0];
  const passwordError = state.fieldErrors?.password?.[0];

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
        />
        {emailError ? (
          <p id="email-error" className="text-sm text-destructive">
            {emailError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Kata sandi</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? "password-error" : undefined}
        />
        {passwordError ? (
          <p id="password-error" className="text-sm text-destructive">
            {passwordError}
          </p>
        ) : null}
      </div>

      <Button type="submit" fullWidth loading={pending} disabled={pending}>
        Masuk
      </Button>
    </form>
  );
}
