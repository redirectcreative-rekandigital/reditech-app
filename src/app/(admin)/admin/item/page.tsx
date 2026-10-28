import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Item",
};

export default function Page() {
  return (
    <RouteStub
      screen="S23"
      title="Item"
      description="Daftar item dengan filter status dan aksi massal (arsip, terbitkan, ubah kategori)."
      requirement="FR-ADM-01..20"
      milestone="M3"
      capability="item:read"
      size="wide"
    />
  );
}
