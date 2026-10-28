import Image from "next/image";

import { isLocalMedia } from "@/lib/media";
import { cn } from "cn";

type MediaImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes: string;
  priority?: boolean;
};

/**
 * Pembungkus `next/image`. Aset demo (`/seed/...`) dilewati optimizer karena
 * berupa SVG lokal; media R2 tetap dioptimalkan dan di-cache CDN.
 */
export function MediaImage({
  src,
  alt,
  width,
  height,
  className,
  sizes,
  priority = false,
}: MediaImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      unoptimized={isLocalMedia(src)}
      className={cn("h-full w-full object-cover object-top", className)}
    />
  );
}
