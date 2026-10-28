import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";
import { requireAdmin } from "@/lib/auth/actor";

export const metadata: Metadata = {
  title: "Ringkasan admin",
};

export default async function Page() {
  // Ringkasan tidak butuh kapabilitas khusus: semua admin boleh melihat
  // antreannya, tetapi tetap wajib lewat guard (layout bukan batas otorisasi).
  await requireAdmin();

  return (
    <RouteStub
      screen="S22"
      title="Ringkasan admin"
      description="Ringkasan operasional: antrean publikasi, pesanan perlu tindakan, dan alert sistem."
      requirement="FR-ADM-01..20"
      milestone="M3"
      size="wide"
    />
  );
}
