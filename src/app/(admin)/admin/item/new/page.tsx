import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Item baru",
};

export default function Page() {
  return (
    <RouteStub
      screen="S23"
      title="Item baru"
      description="Editor item dengan tab Dasar, Konten, Harga, Berkas, Galeri, dan SEO."
      requirement="FR-ADM-01..20"
      milestone="M3"
      capability="item:write"
      size="wide"
    />
  );
}
