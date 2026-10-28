import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Entitlement",
};

export default function Page() {
  return (
    <RouteStub
      title="Entitlement"
      description="Pencarian akses berdasarkan email, slug, atau nomor pesanan; grant dan revoke tercatat di audit."
      requirement="FR-ADM-01..20"
      milestone="M5"
      capability="entitlement:grant"
      size="wide"
    />
  );
}
