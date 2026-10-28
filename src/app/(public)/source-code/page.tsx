import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Katalog source code",
};

export default function Page() {
  return (
    <RouteStub
      screen="S02"
      title="Katalog source code"
      description="Daftar seluruh source code dengan filter tipe, kategori, teknologi, dan pencarian. Semua keadaan filter hidup di query string."
      requirement="FR-CAT-02..13"
      milestone="M1"
    />
  );
}
