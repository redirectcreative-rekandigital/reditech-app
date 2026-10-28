import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Kebijakan privasi",
};

export default function Page() {
  return (
    <RouteStub
      screen="S13"
      title="Kebijakan privasi"
      description="Kebijakan privasi: data yang dikumpulkan, dasar pemrosesan, retensi, dan hak pengguna."
      requirement="FR-CMS-07"
      milestone="M6"
    />
  );
}
