import { ImageResponse } from "next/og";

import { OgCard, ogSize } from "@/lib/og";

export const alt = "Reditech — source code siap pakai untuk developer Indonesia";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <OgCard eyebrow="Reditech" title="Source code siap pakai untuk developer Indonesia" />,
    ogSize,
  );
}
