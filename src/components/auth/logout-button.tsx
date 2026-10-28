"use client";

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

import { logoutAction } from "@/app/(auth)/actions";

/**
 * Logout dengan konfirmasi (F7/FR-AUTH-06): sesi dihapus dari database oleh
 * Server Action, bukan hanya cookie-nya.
 */
export function LogoutButton() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Keluar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Keluar dari panel?</AlertDialogTitle>
          <AlertDialogDescription>
            Sesi ini akan dihapus dari server. Kamu perlu masuk dan memverifikasi ulang untuk kembali.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <form action={logoutAction}>
            <AlertDialogAction type="submit">Keluar</AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
