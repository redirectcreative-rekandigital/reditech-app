import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Pembelian",
};

export default function Page() {
  return (
    <RouteStub
      screen="S17"
      title="Pembelian"
      description="Riwayat pesanan berstatus PAID, FULFILLED, dan REFUNDED dengan tautan invoice."
      requirement="FR-DASH-01..07"
      milestone="M4"
      capability="USER"
    />
  );
}
