import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Ringkasan akun",
};

export default function Page() {
  return (
    <RouteStub
      screen="S15"
      title="Ringkasan akun"
      description="Sapaan, tiga kartu statistik, dan daftar pembelian terakhir milik pengguna."
      requirement="FR-DASH-01..07"
      milestone="M4"
      capability="USER"
    />
  );
}
