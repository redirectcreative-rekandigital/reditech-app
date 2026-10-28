import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Masuk",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RouteStub
      screen="S05"
      title="Masuk"
      description="Formulir masuk dengan email/kata sandi dan Google OAuth, plus tautan pemulihan."
      requirement="FR-AUTH-01..03"
      milestone="M4"
    />
  );
}
