import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Source code saya",
};

export default function Page() {
  return (
    <RouteStub
      screen="S16"
      title="Source code saya"
      description="Item yang entitlement-nya aktif beserta tombol unduh ulang."
      requirement="FR-DASH-01..07"
      milestone="M4"
      capability="USER"
    />
  );
}
