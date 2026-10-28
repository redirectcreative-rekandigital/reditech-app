"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui-ext/button";

import type { ActionState, AdminAction } from "./action-form";

/**
 * Tombol hapus untuk baris daftar panel.
 *
 * Aksi dipanggil dari `onClick` (bukan `<form>` di dalam dialog) karena
 * `AlertDialogContent` melepas isinya saat ditutup: form yang berada di
 * dalamnya hilang sebelum hasil aksi datang, sehingga toast sukses tidak
 * pernah tampil. Dialog sendiri butuh JavaScript, jadi tidak ada jalur tanpa
 * JS yang hilang di sini.
 *
 * Bila entitas masih dipakai (`blockedReason`), tombol dimatikan dengan alasan
 * di `title`; server tetap menolak penghapusan walau UI dilewati.
 */
export function DeleteRowButton({
  action,
  id,
  entityLabel,
  itemName,
  blockedReason,
}: {
  action: AdminAction;
  id: string;
  entityLabel: string;
  itemName: string;
  blockedReason?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (blockedReason) {
    return (
      <Button variant="ghost" size="sm" disabled title={blockedReason}>
        Hapus
      </Button>
    );
  }

  function remove() {
    setOpen(false);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);

      const result: ActionState = await action({}, formData);

      if (result.ok) {
        toast.success(result.message ?? `${entityLabel} dihapus.`);
        router.refresh();
        return;
      }

      toast.error(result.error ?? `${entityLabel} gagal dihapus.`);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" loading={pending}>
          Hapus
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Hapus {entityLabel.toLowerCase()} “{itemName}”?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini permanen dan tercatat di audit log. Kalau hanya ingin menyembunyikannya
            dari katalog, nonaktifkan saja.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" size="sm" onClick={remove}>
              Hapus
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
