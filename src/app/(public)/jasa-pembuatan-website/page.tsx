import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Jasa pembuatan website",
};

export default function Page() {
  return (
    <RouteStub
      screen="S11"
      title="Jasa pembuatan website"
      description="Penawaran jasa pembuatan website dengan cakupan, alur kerja, dan CTA WhatsApp."
      requirement="FR-CMS-06"
      milestone="M6"
    />
  );
}
