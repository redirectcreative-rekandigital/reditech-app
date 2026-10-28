import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Daftar",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RouteStub
      screen="S06"
      title="Daftar"
      description="Formulir pendaftaran akun dengan verifikasi email dan persetujuan syarat ketentuan."
      requirement="FR-AUTH-01..03"
      milestone="M4"
    />
  );
}
