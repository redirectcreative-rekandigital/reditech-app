import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Profil",
};

export default function Page() {
  return (
    <RouteStub
      screen="S20"
      title="Profil"
      description="Formulir nama dan email (email nonaktif), serta bagian kata sandi yang menyesuaikan mode akun."
      requirement="FR-AUTH-04..05"
      milestone="M4"
      capability="USER"
    />
  );
}
