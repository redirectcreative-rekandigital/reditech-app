import type { Metadata } from "next";

import { ForbiddenView } from "@/components/system/forbidden-view";

export const metadata: Metadata = {
  title: "Tidak punya akses",
  description: "Akun ini tidak memiliki izin membuka panel pengelola Reditech.",
  robots: { index: false, follow: false },
};

/**
 * Sasaran proxy untuk akun non-admin, dikirim ulang dengan status `403`.
 * Alasannya sama dengan `/404` dan `/410`: status HTTP harus ditentukan
 * sebelum render (lihat `12-route-map.md` 12).
 */
export default function Page() {
  return <ForbiddenView />;
}
