import { ImageResponse } from "next/og";

import { OgCard, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";

/**
 * M1 mengganti judul ini dengan nama item dari database; slug hanya
 * cadangan agar gambar tidak pernah gagal dirender.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = slug.replace(/-/g, " ");

  return new ImageResponse(<OgCard eyebrow="Source code" title={title} />, ogSize);
}
