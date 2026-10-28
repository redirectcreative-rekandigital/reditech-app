"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui-ext/button";
import { cn } from "cn";

/**
 * Kontrak hasil Server Action panel. Semua aksi mengembalikan bentuk ini:
 * `ok` untuk memicu toast + refresh, `error` untuk pesan umum, `fieldErrors`
 * untuk kesalahan per field (`z.flattenError`).
 */
export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  /** Pesan sukses khusus (mis. "Draf tersimpan"). */
  message?: string;
};

export type AdminAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

type ActionFormProps = {
  action: AdminAction;
  children: React.ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  successMessage?: string;
  className?: string;
  buttonClassName?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "destructiveOutline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  /** Kosongkan input setelah berhasil (dipakai form "tambah"). */
  resetOnSuccess?: boolean;
  /** Nama field yang ramah dibaca, mis. `{ slug: "Slug" }`. */
  fieldLabels?: Record<string, string>;
};

/**
 * Form panel dengan status aksi. Kesalahan tetap tampil tanpa JavaScript
 * (form memakai `action`, bukan `onSubmit`), dan `router.refresh()` menjaga
 * daftar di bawahnya ikut segar setelah simpan.
 */
export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel,
  successMessage = "Tersimpan.",
  className,
  buttonClassName,
  variant = "primary",
  size = "sm",
  fullWidth = false,
  resetOnSuccess = false,
  fieldLabels,
}: ActionFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const id = useId();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  useEffect(() => {
    if (!state.ok) return;

    toast.success(state.message ?? successMessage);
    if (resetOnSuccess) formRef.current?.reset();
    router.refresh();
  }, [state, successMessage, resetOnSuccess, router]);

  const fieldErrors = Object.entries(state.fieldErrors ?? {});

  return (
    <form ref={formRef} action={formAction} className={cn("flex flex-col gap-3", className)}>
      {children}

      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {fieldErrors.length > 0 ? (
        <div
          id={`${id}-errors`}
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm"
        >
          <ul className="flex flex-col gap-1">
            {fieldErrors.map(([field, messages]) => (
              <li key={field}>
                <span className="font-medium">{fieldLabels?.[field] ?? field}</span>: {messages.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={cn(fullWidth && "w-full")}>
        <Button
          type="submit"
          variant={variant}
          size={size}
          loading={pending}
          fullWidth={fullWidth}
          className={buttonClassName}
        >
          {pending ? (pendingLabel ?? "Menyimpan…") : submitLabel}
        </Button>
      </div>
    </form>
  );
}
