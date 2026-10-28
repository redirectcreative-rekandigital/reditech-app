import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Pengaturan",
};

export default function Page() {
  return (
    <RouteStub
      screen="S27"
      title="Pengaturan"
      description="Pengaturan situs per tab: Umum, Harga, Pembayaran, Iklan, Email, SEO, dan Keamanan."
      requirement="FR-ADM-01..20"
      milestone="M3"
      capability="setting:read"
      size="wide"
    />
  );
}
