const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const longDate = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "Rp 49.000" — nominal selalu rupiah penuh, tanpa desimal. */
export function formatIdr(value: number): string {
  return idr.format(value);
}

/** "1 Oktober 2026" */
export function formatDate(value: Date): string {
  return longDate.format(value);
}

/** "1.177" — pemisah ribuan gaya Indonesia. */
export function formatCount(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}
