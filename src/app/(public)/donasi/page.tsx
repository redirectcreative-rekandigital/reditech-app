import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Sponsor",
};

export default function Page() {
  return (
    <RouteStub
      screen="S09"
      title="Sponsor"
      description="Papan sponsor dan paket dukungan; tautan sponsor diberi rel sponsored nofollow."
      requirement="FR-CMS-03..04"
      milestone="M6"
    />
  );
}
