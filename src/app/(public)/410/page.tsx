import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Item tidak lagi tersedia",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RouteStub
      title="Item tidak lagi tersedia"
      description="Halaman 410 untuk item yang sudah diarsipkan; tidak dialihkan ke item lain."
      requirement="FR-ITEM-09"
      milestone="M1"
    />
  );
}
