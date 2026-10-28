import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { catalogHref, type CatalogFilters } from "@/lib/catalog";
import { cn } from "cn";

/** Nomor halaman yang ditampilkan: ujung-ujung, sekitar halaman aktif, elipsis. */
function pageItems(current: number, total: number): Array<number | "gap"> {
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  const items: Array<number | "gap"> = [];
  let previous = 0;

  for (const page of sorted) {
    if (previous && page - previous > 1) items.push("gap");
    items.push(page);
    previous = page;
  }

  return items;
}

const linkClass =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-border-strong px-3 text-sm font-medium text-foreground hover:bg-muted focus-ring";

/**
 * `Pagination` — FR-CAT-07/08.
 * Tautan selalu membawa filter lain; halaman 1 tidak ditulis di URL.
 */
export function Pagination({
  filters,
  page,
  totalPages,
}: {
  filters: CatalogFilters;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginasi katalog" className="flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          href={catalogHref(filters, { page: page - 1 })}
          rel="prev"
          className={linkClass}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Sebelumnya</span>
        </Link>
      ) : null}

      {pageItems(page, totalPages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={catalogHref(filters, { page: item })}
            aria-current={item === page ? "page" : undefined}
            aria-label={`Halaman ${item}`}
            className={cn(
              linkClass,
              item === page && "border-transparent bg-secondary text-secondary-foreground",
            )}
          >
            {item}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          href={catalogHref(filters, { page: page + 1 })}
          rel="next"
          className={linkClass}
        >
          <span className="sr-only sm:not-sr-only">Berikutnya</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}
