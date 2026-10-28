import { cn } from "cn";

type CategoryChipsProps = {
  categories: Array<{ name: string; slug: string }>;
  value: string | null;
};

/**
 * `CategoryChips` — radio yang tampil sebagai chip, satu grup dengan `Tipe`.
 * "Semua kategori" bernilai kosong sehingga parameternya hilang saat dikirim.
 */
export function CategoryChips({ categories, value }: CategoryChipsProps) {
  const options = [{ name: "Semua kategori", slug: "" }, ...categories];

  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Kategori
      </legend>
      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
        {options.map((option) => (
          <label key={option.slug || "semua"} className="relative snap-start">
            <input
              type="radio"
              name="kategori"
              value={option.slug}
              defaultChecked={(value ?? "") === option.slug}
              className="peer sr-only"
            />
            <span
              className={cn(
                "block cursor-pointer whitespace-nowrap rounded-full border border-border-strong px-3 py-1.5 text-sm text-foreground",
                "peer-checked:border-transparent peer-checked:bg-secondary peer-checked:text-secondary-foreground",
                "peer-focus-visible:focus-ring hover:bg-muted",
              )}
            >
              {option.name}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
