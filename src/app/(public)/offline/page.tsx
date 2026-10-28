import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Anda sedang offline",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RouteStub
      title="Anda sedang offline"
      description="Halaman cadangan ketika jaringan terputus; menampilkan tautan yang tersedia dari cache."
      requirement="NFR-06"
      milestone="M7"
    />
  );
}
