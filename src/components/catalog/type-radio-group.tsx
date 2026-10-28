import { CATALOG_TYPE_OPTIONS, type CatalogType } from "@/lib/catalog";
import { cn } from "cn";

/**
 * `TypeRadioGroup` — radio asli di dalam form GET.
 * Tanpa JavaScript, pilihan baru berlaku saat `Terapkan filter` ditekan.
 */
export function TypeRadioGroup({ value }: { value: CatalogType | null }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Tipe
      </legend>
      <div className="inline-flex rounded-md border border-border-strong bg-background p-0.5">
        {CATALOG_TYPE_OPTIONS.map((option) => (
          <label key={option.label} className="relative">
            <input
              type="radio"
              name="type"
              value={option.value ?? ""}
              defaultChecked={value === option.value}
              className="peer sr-only"
            />
            <span
              className={cn(
                "block cursor-pointer rounded-sm px-3 py-1.5 text-sm font-medium text-muted-foreground",
                "peer-checked:bg-primary peer-checked:text-primary-foreground",
                "peer-focus-visible:focus-ring hover:bg-muted",
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
