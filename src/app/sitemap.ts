import type { MetadataRoute } from "next";

const BASE_URL = "https://www.reditech.id";

/**
 * M0: rute statis saja. M1 mengambil item PUBLISHED dari database,
 * `lastmod` dari `updatedAt`, tanpa URL ber-query (`12-route-map.md` 10).
 */
const staticRoutes: Array<{ path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }> = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/source-code", priority: 0.9, changeFrequency: "daily" },
  { path: "/tutorial", priority: 0.8, changeFrequency: "weekly" },
  { path: "/donasi", priority: 0.5, changeFrequency: "weekly" },
  { path: "/jasa-pembuatan-website", priority: 0.6, changeFrequency: "monthly" },
  { path: "/request-aplikasi", priority: 0.4, changeFrequency: "monthly" },
  { path: "/kontak", priority: 0.3, changeFrequency: "yearly" },
  { path: "/kebijakan-privasi", priority: 0.2, changeFrequency: "yearly" },
  { path: "/syarat-ketentuan", priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return staticRoutes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
