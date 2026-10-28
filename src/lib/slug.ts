/**
 * Slug kanonik untuk semua entitas beralamat: item, tutorial, kategori,
 * teknologi. Pola ini juga yang dipakai proxy/pencarian, jadi jangan
 * menduplikasi regex di tempat lain.
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "ERP Gudang — Laravel" → "erp-gudang-laravel". */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

/** Untuk form: slug kosong diisi otomatis dari judul, selain itu dibiarkan. */
export function slugFrom(formData: FormData, source: string): string {
  const explicit = String(formData.get("slug") ?? "").trim().toLowerCase();
  return explicit || slugify(String(formData.get(source) ?? ""));
}
