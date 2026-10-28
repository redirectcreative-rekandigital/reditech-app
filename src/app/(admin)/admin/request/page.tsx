import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Usulan aplikasi",
};

export default function Page() {
  return (
    <RouteStub
      title="Usulan aplikasi"
      description="Pipeline usulan aplikasi dari masuk sampai dijawab."
      requirement="FR-ADM-01..20"
      milestone="M6"
      capability="request:read"
      size="wide"
    />
  );
}
