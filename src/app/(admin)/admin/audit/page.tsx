import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Audit",
};

export default function Page() {
  return (
    <RouteStub
      screen="S28"
      title="Audit"
      description="Log audit dengan filter aktor, aksi, dan entitas; ekspor CSV maksimal 90 hari."
      requirement="FR-ADM-01..20"
      milestone="M6"
      capability="audit:read"
      size="wide"
    />
  );
}
