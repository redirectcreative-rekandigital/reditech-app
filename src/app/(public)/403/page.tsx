import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Akses ditolak",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RouteStub
      screen="S29"
      title="Akses ditolak"
      description="Halaman 403 yang menjelaskan bahwa akun ini tidak memiliki kapabilitas untuk membuka panel admin."
      requirement="AC-ADM-09"
      milestone="M3"
    />
  );
}
