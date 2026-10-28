import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

/**
 * Rute ini memakai `params`, sehingga tidak bisa dirender sebagai shell statis.
 * M1 menggantinya dengan <Suspense> + skeleton agar navigasi tetap instan.
 */
export const instant = false;

type PageProps = { params: Promise<{ orderNo: string }> };

export default async function Page({ params }: PageProps) {
  const { orderNo } = await params;

  return (
    <RouteStub
      screen="S21"
      title="Checkout"
      description="Halaman pembayaran pesanan: rincian harga dari server, status pembayaran, dan instruksi DOKU."
      requirement="FR-PAY-01..11"
      milestone="M5"
      params={{ orderNo }}
    />
  );
}
