import { cacheLife } from "next/cache";

export const SITE_URL = "https://www.reditech.id";
export const SITE_NAME = "Reditech";

/**
 * Cache Components melarang `new Date()` saat prerender karena nilai itu
 * berubah antar-render. Tahun hak cipta dihitung sekali lalu di-cache.
 */
export async function getCopyrightYear() {
  "use cache";
  cacheLife("max");
  return new Date().getFullYear();
}
