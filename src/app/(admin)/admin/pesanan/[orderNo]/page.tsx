import type { Metadata } from "next";

import { RouteStub } from "@/components/dev/route-stub";
import { requireCapability } from "@/lib/auth/actor";

export const metadata: Metadata = {
  title: "Detail pesanan",
};

/**
 * Rute ini memakai `params`, sehingga tidak bisa dirender sebagai shell statis.
 * M1 menggantinya dengan <Suspense> + skeleton agar navigasi tetap instan.
 */
export const instant = false;

type PageProps = { params: Promise<{ orderNo: string }> };

export default async function Page({ params }: PageProps) {
  const { orderNo } = await params;
  // Guard per halaman: layout tidak menghentikan render segmen lain, jadi
  // otorisasi tidak boleh bergantung pada layout (09-superadmin-admin.md 8).
  await requireCapability("order:read");


  return (
    <RouteStub
      screen="S25"
      title="Detail pesanan"
      description="Linimasa pesanan, sinkronisasi status DOKU, dan aksi refund bila kapabilitas mengizinkan."
      requirement="FR-ADM-01..20"
      milestone="M5"
      capability="order:read"
      size="wide"
      params={{ orderNo }}
    />
  );
}
