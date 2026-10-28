import { CATALOG_SORT_OPTIONS, type CatalogSort } from "@/lib/catalog";

/**
 * `SortCombobox` versi tanpa JavaScript: `<select>` asli.
 * Membuka popover+command akan membuat urutan mustahil diubah tanpa JS,
 * sedangkan FR-CAT-06 mensyaratkan tiga urutan yang selalu bisa dipilih.
 */
export function SortSelect({ value }: { value: CatalogSort }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Urutkan
      </span>
      <select
        name="sort"
        defaultValue={value}
        className="h-10 rounded-md border border-border-strong bg-background px-3 text-sm text-foreground focus-ring"
      >
        {CATALOG_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
