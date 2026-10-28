import Link from "next/link";
import { Search } from "lucide-react";

import { CategoryChips } from "@/components/catalog/category-chips";
import { FilterAutoSubmit } from "@/components/catalog/filter-auto-submit";
import { ResultCount } from "@/components/catalog/result-count";
import { SortSelect } from "@/components/catalog/sort-select";
import { TypeRadioGroup } from "@/components/catalog/type-radio-group";
import { Button } from "@/components/ui-ext/button";
import type { CatalogFilters } from "@/lib/catalog";

const FORM_ID = "filter-katalog";

type FilterBarProps = {
  filters: CatalogFilters;
  categories: Array<{ name: string; slug: string }>;
  result: { from: number; to: number; total: number };
};

/**
 * `FilterBar` — seluruh keadaan filter hidup di query string (FR-CAT-11).
 *
 * Form GET biasa: tanpa JavaScript semua kontrol tetap bisa dipakai dengan
 * menekan `Terapkan filter`. Dengan JavaScript, `FilterAutoSubmit` mengirim
 * form segera setelah radio/select berubah.
 */
export function FilterBar({ filters, categories, result }: FilterBarProps) {
  const hasFilter = Boolean(
    filters.search || filters.type || filters.kategori || filters.sort !== "newest",
  );

  return (
    <div className="flex flex-col gap-6">
      <form
        id={FORM_ID}
        action="/source-code"
        method="get"
        className="flex flex-col gap-5 rounded-lg border border-border bg-card p-4 sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cari di katalog
            </span>
            <span className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                name="search"
                defaultValue={filters.search ?? ""}
                maxLength={100}
                placeholder="Misalnya kasir, undangan, gudang"
                className="h-10 w-full rounded-md border border-border-strong bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-ring"
              />
            </span>
          </label>

          <SortSelect value={filters.sort} />

          <Button type="submit" variant="outline">
            Terapkan filter
          </Button>
        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
          <TypeRadioGroup value={filters.type} />
          <div className="min-w-0 flex-1">
            <CategoryChips categories={categories} value={filters.kategori} />
          </div>
        </div>

        {hasFilter ? (
          <div>
            <Link
              href="/source-code"
              className="text-sm text-foreground underline underline-offset-4 hover:text-muted-foreground focus-ring"
            >
              Hapus semua filter
            </Link>
          </div>
        ) : null}

        <FilterAutoSubmit formId={FORM_ID} />
      </form>

      <ResultCount
        from={result.from}
        to={result.to}
        total={result.total}
        query={filters.search}
      />
    </div>
  );
}
