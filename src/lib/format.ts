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

/** "18,3 MB" — ukuran berkas untuk peringatan unduhan (FR-DL-09). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: value < 10 ? 1 : 0 }).format(value)} ${units[exponent]}`;
}
