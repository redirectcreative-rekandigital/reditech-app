import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Ringkasan admin",
};

export default function Page() {
  return (
    <RouteStub
      screen="S22"
      title="Ringkasan admin"
      description="Ringkasan operasional: antrean publikasi, pesanan perlu tindakan, dan alert sistem."
      requirement="FR-ADM-01..20"
      milestone="M3"
      capability="order:read"
      size="wide"
    />
  );
}
