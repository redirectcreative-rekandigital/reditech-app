import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Teknologi",
};

export default function Page() {
  return (
    <RouteStub
      title="Teknologi"
      description="CRUD teknologi untuk filter katalog, dengan ikon dan pengelompokan."
      requirement="FR-ADM-01..20"
      milestone="M6"
      capability="taxonomy:read"
      size="wide"
    />
  );
}
