import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Kontak",
};

export default function Page() {
  return (
    <RouteStub
      screen="S12"
      title="Kontak"
      description="Kanal kontak resmi Reditech tanpa formulir, agar tidak ada data pribadi yang tersimpan tanpa perlu."
      requirement="FR-CMS-07"
      milestone="M6"
    />
  );
}
