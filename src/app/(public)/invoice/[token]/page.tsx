import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

/**
 * Rute ini memakai `params`, sehingga tidak bisa dirender sebagai shell statis.
 * M1 menggantinya dengan <Suspense> + skeleton agar navigasi tetap instan.
 */
export const instant = false;

type PageProps = { params: Promise<{ token: string }> };

export default async function Page({ params }: PageProps) {
  const { token } = await params;

  return (
    <RouteStub
      screen="S18"
      title="Invoice"
      description="Invoice publik bertoken, berlaku 7 hari, dapat dicetak dalam tata letak A4."
      requirement="FR-PAY-01..11"
      milestone="M5"
      params={{ token }}
    />
  );
}
