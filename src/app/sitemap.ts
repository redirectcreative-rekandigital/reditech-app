import type { MetadataRoute } from "next";
import { connection } from "next/server";

import { prisma } from "@/lib/prisma";

const BASE_URL = "https://www.reditech.id";

/**
 * Rute statis + item/tutorial PUBLISHED — `12-route-map.md` 10.
 * Tidak ada URL ber-query. `connection()` menunda pembacaan database ke waktu
 * permintaan, dan kegagalan database tidak boleh membuat sitemap 500.
 */
const staticRoutes: Array<{
  path: string;
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
}> = [
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();

  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const [items, tutorials] = await Promise.all([
      prisma.item.findMany({
        where: { status: "PUBLISHED", deletedAt: null },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: "desc" },
      }),
      prisma.tutorial.findMany({
        where: { status: "PUBLISHED", deletedAt: null },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: "desc" },
      }),
    ]);

    entries.push(
      ...items.map((item) => ({
        url: `${BASE_URL}/source-code/${item.slug}`,
        lastModified: item.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...tutorials.map((tutorial) => ({
        url: `${BASE_URL}/tutorial/${tutorial.slug}`,
        lastModified: tutorial.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    );
  } catch {
    // Database tidak tersedia: sitemap tetap berisi rute statis.
  }

  return entries;
}
