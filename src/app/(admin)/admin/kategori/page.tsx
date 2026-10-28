import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Kategori",
};

export default function Page() {
  return (
    <RouteStub
      title="Kategori"
      description="CRUD kategori secara inline, termasuk slug, urutan, dan status aktif."
      requirement="FR-ADM-01..20"
      milestone="M6"
      capability="taxonomy:read"
      size="wide"
    />
  );
}
