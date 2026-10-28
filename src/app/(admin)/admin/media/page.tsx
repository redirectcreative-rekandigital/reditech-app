import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Media",
};

export default function Page() {
  return (
    <RouteStub
      title="Media"
      description="Pustaka media dengan unggah maksimum 5 MB dan kewajiban teks alt."
      requirement="FR-ADM-01..20"
      milestone="M3"
      capability="media:read"
      size="wide"
    />
  );
}
