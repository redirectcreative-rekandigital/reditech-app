import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Antrean ulasan",
};

export default function Page() {
  return (
    <RouteStub
      screen="S24"
      title="Antrean ulasan"
      description="Antrean approval revisi konten dengan tampilan diff sebelum disetujui."
      requirement="FR-ADM-01..20"
      milestone="M6"
      capability="item:publish"
      size="wide"
    />
  );
}
