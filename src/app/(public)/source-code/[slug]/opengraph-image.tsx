import { ImageResponse } from "next/og";

import { OgCard, ogSize } from "@/lib/og";
import { prisma } from "@/lib/prisma";

export const size = ogSize;
export const contentType = "image/png";

/**
 * OG per item — FR-ITEM-09. Judul diambil dari database; slug hanya cadangan
 * agar gambar tidak pernah gagal dirender ketika item tidak ada atau DB mati.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let title = slug.replace(/-/g, " ");

  try {
    const item = await prisma.item.findUnique({
      where: { slug },
      select: { title: true, seoTitle: true },
    });
    if (item) title = item.seoTitle ?? item.title;
  } catch {
    // DB tidak tersedia — tetap hasilkan gambar dari slug.
  }

  return new ImageResponse(<OgCard eyebrow="Source code" title={title} />, ogSize);
}
