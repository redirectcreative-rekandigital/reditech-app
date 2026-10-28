import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Tutorial baru",
};

export default function Page() {
  return (
    <RouteStub
      title="Tutorial baru"
      description="Editor MDX dengan pratinjau, metadata SEO, dan pemeriksaan sebelum terbit."
      requirement="FR-ADM-01..20"
      milestone="M6"
      capability="tutorial:write"
      size="wide"
    />
  );
}
