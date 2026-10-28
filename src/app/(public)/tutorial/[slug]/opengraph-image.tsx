import { ImageResponse } from "next/og";

import { OgCard, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = slug.replace(/-/g, " ");

  return new ImageResponse(<OgCard eyebrow="Tutorial" title={title} />, ogSize);
}
