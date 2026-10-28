import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Sponsor",
};

export default function Page() {
  return (
    <RouteStub
      title="Sponsor"
      description="Daftar sponsor dan antrean moderasi materi iklan."
      requirement="FR-ADM-01..20"
      milestone="M6"
      capability="sponsor:read"
      size="wide"
    />
  );
}
