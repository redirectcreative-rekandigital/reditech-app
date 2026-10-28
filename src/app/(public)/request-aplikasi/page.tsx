import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Request aplikasi",
};

export default function Page() {
  return (
    <RouteStub
      screen="S10"
      title="Request aplikasi"
      description="Formulir usulan aplikasi baru dengan honeypot, batas waktu pengisian, dan token status."
      requirement="FR-CMS-05"
      milestone="M6"
    />
  );
}
