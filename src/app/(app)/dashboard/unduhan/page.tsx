import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Riwayat unduhan",
};

export default function Page() {
  return (
    <RouteStub
      screen="S19"
      title="Riwayat unduhan"
      description="Lima puluh unduhan terakhir dengan tujuan unduhan dan waktu kejadian."
      requirement="FR-DASH-01..07"
      milestone="M4"
      capability="USER"
    />
  );
}
