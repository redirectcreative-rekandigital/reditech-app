import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Pesanan",
};

export default function Page() {
  return (
    <RouteStub
      screen="S25"
      title="Pesanan"
      description="Daftar pesanan dengan filter status pembayaran dan rentang tanggal."
      requirement="FR-ADM-01..20"
      milestone="M5"
      capability="order:read"
      size="wide"
    />
  );
}
