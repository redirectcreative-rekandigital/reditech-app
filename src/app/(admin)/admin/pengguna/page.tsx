import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Pengguna",
};

export default function Page() {
  return (
    <RouteStub
      screen="S26"
      title="Pengguna"
      description="Daftar pengguna, penetapan peran, dan penangguhan akun."
      requirement="FR-ADM-01..20"
      milestone="M4"
      capability="user:read"
      size="wide"
    />
  );
}
