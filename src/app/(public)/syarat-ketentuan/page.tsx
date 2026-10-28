import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Syarat & ketentuan",
};

export default function Page() {
  return (
    <RouteStub
      screen="S14"
      title="Syarat & ketentuan"
      description="Syarat dan ketentuan penggunaan katalog, lisensi source code, pembayaran, dan pengembalian dana."
      requirement="FR-CMS-07"
      milestone="M6"
    />
  );
}
