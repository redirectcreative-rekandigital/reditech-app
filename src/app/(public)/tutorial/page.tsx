import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Tutorial",
};

export default function Page() {
  return (
    <RouteStub
      screen="S07"
      title="Tutorial"
      description="Daftar artikel tutorial, diurutkan dari yang terbaru, dengan penanda tingkat kesulitan."
      requirement="FR-CMS-01..02"
      milestone="M6"
    />
  );
}
