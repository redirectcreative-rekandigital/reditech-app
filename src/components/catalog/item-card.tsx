import Link from "next/link";
import { Download } from "lucide-react";

import { MediaImage } from "@/components/media/media-image";
import { Badge } from "@/components/ui-ext/badge";
import type { CatalogCard } from "@/lib/catalog";
import { formatCount, formatIdr } from "@/lib/format";

/**
 * `ItemCard` — `11-component-inventory.md` 6.
 * Satu tautan membungkus seluruh kartu; `alt` gambar = judul item.
 */
export function ItemCard({ item }: { item: CatalogCard }) {
  const isPremium = item.type === "PREMIUM";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-card transition-shadow hover:shadow-pop">
      <Link
        href={`/source-code/${item.slug}`}
        className="flex h-full flex-col focus-visible:focus-ring"
      >
        <div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-muted">
          {item.thumbnail ? (
            <div className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]">
              <MediaImage
                src={item.thumbnail.url}
                alt={item.title}
                width={item.thumbnail.width}
                height={item.thumbnail.height}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
            </div>
          ) : (
            <div
              aria-hidden="true"
              className="flex h-full w-full items-center justify-center bg-muted text-2xl font-semibold text-muted-foreground"
            >
              {item.title.slice(0, 1)}
            </div>
          )}

          <div className="absolute left-3 top-3">
            <Badge tone={isPremium ? "premium" : "free"}>
              {isPremium ? "Premium" : "Gratis"}
            </Badge>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          {item.category ? (
            <p className="text-xs font-medium text-muted-foreground">{item.category.name}</p>
          ) : null}

          <h3 className="text-base font-semibold leading-snug group-hover:underline">
            {item.title}
          </h3>

          <p className="line-clamp-2 text-sm text-muted-foreground">{item.shortDescription}</p>

          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            <p className="text-sm">
              {isPremium && item.priceIdr !== null ? (
                <span className="font-semibold">{formatIdr(item.priceIdr)}</span>
              ) : (
                <span className="font-semibold">Gratis</span>
              )}
              {!isPremium && item.noAdsPriceIdr !== null ? (
                <span className="block text-xs font-normal text-muted-foreground">
                  {formatIdr(item.noAdsPriceIdr)} tanpa iklan
                </span>
              ) : null}
            </p>

            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Download className="size-3.5" aria-hidden="true" />
              <span>{formatCount(item.downloadCount)} unduhan</span>
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
