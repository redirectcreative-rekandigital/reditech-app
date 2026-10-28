import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Keamanan akun",
};

export default function Page() {
  return (
    <RouteStub
      screen="S20"
      title="Keamanan akun"
      description="Pendaftaran dan penonaktifan MFA, plus daftar sesi aktif yang bisa dicabut."
      requirement="FR-AUTH-04..05"
      milestone="M4"
      capability="USER"
    />
  );
}
