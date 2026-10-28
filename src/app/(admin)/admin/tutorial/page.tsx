import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Tutorial",
};

export default function Page() {
  return (
    <RouteStub
      title="Tutorial"
      description="Daftar artikel tutorial beserta status publikasi dan penulisnya."
      requirement="FR-ADM-01..20"
      milestone="M6"
      capability="tutorial:read"
      size="wide"
    />
  );
}
