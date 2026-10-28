import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Status sponsor",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RouteStub
      screen="S09"
      title="Status sponsor"
      description="Halaman kembali dari DOKU yang menampilkan status pembayaran sponsor dan tautan ke papan sponsor."
      requirement="FR-CMS-03..04"
      milestone="M5"
    />
  );
}
