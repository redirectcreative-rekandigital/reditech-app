import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";

export const metadata: Metadata = {
  title: "Detail pembelian",
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
      screen="S18"
      title="Detail pembelian"
      description="Invoice, status pembayaran, dan tombol unduh ulang untuk pesanan milik pengguna."
      requirement="FR-DASH-01..07"
      milestone="M5"
      capability="USER"
      params={{ orderNo }}
    />
  );
}
