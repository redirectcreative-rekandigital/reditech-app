import { Prisma } from "@prisma/client";
import { cacheLife, cacheTag } from "next/cache";

import { mediaUrl } from "@/lib/media";
import { prisma } from "@/lib/prisma";

export type ItemStatus = "published" | "archived" | "missing";

/** Status + tipe untuk jalur unduhan (proxy harus tahu sebelum render). */
export type ItemAccess = { status: ItemStatus; type: "FREE" | "PREMIUM" };

/**
 * Status ringkas untuk proxy: `DRAFT`/`IN_REVIEW` tidak boleh terlihat, jadi
 * diperlakukan sama seperti tidak ada. `ARCHIVED` dipetakan ke `410` oleh proxy
 * (`02-requirements.md` FR-ITEM-08), bukan `404`.
 */
export async function getItemStatus(slug: string): Promise<ItemStatus> {
  const item = await prisma.item.findUnique({
    where: { slug },
    select: { status: true, deletedAt: true },
  });

  if (!item || item.deletedAt) return "missing";
  if (item.status === "ARCHIVED") return "archived";
  if (item.status === "PUBLISHED") return "published";
  return "missing";
}

/**
 * Status + tipe item untuk halaman unduhan. Sengaja tidak di-cache: proxy harus
 * melihat arsip atau perubahan tipe segera, sama seperti `getItemStatus`.
 */
export async function getItemAccess(slug: string): Promise<ItemAccess | null> {
  const item = await prisma.item.findUnique({
    where: { slug },
    select: { status: true, type: true, deletedAt: true },
  });

  if (!item) return null;

  const status: ItemStatus =
    item.deletedAt || (item.status !== "PUBLISHED" && item.status !== "ARCHIVED")
      ? "missing"
      : item.status === "ARCHIVED"
        ? "archived"
        : "published";

  return { status, type: item.type };
}

const detailSelect = {
  slug: true,
  title: true,
  type: true,
  status: true,
  shortDescription: true,
  description: true,
  howItWorks: true,
  license: true,
  demoUrl: true,
  priceIdr: true,
  noAdsPriceIdr: true,
  releasedAt: true,
  publishedAt: true,
  downloadCount: true,
  seoTitle: true,
  seoDescription: true,
  category: { select: { name: true, slug: true } },
  thumbnail: { select: { key: true, alt: true, width: true, height: true } },
  technologies: { select: { technology: { select: { name: true, slug: true } } } },
  features: { orderBy: { order: "asc" }, select: { order: true, text: true } },
  steps: { orderBy: { order: "asc" }, select: { order: true, title: true, body: true } },
  screenshots: {
    orderBy: { order: "asc" },
    select: {
      order: true,
      caption: true,
      media: { select: { key: true, alt: true, width: true, height: true } },
    },
  },
} satisfies Prisma.ItemSelect;

export type ItemScreenshot = {
  url: string;
  alt: string;
  caption: string | null;
  width: number;
  height: number;
};

export type ItemDetail = {
  slug: string;
  title: string;
  type: "FREE" | "PREMIUM";
  shortDescription: string;
  description: string;
  howItWorks: string | null;
  license: string | null;
  demoUrl: string | null;
  priceIdr: number | null;
  noAdsPriceIdr: number | null;
  releasedAt: Date | null;
  publishedAt: Date | null;
  downloadCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
  category: { name: string; slug: string } | null;
  thumbnail: { url: string; alt: string; width: number; height: number } | null;
  technologies: Array<{ name: string; slug: string }>;
  features: Array<{ order: number; text: string }>;
  steps: Array<{ order: number; title: string; body: string }>;
  screenshots: ItemScreenshot[];
};

/**
 * `null` untuk draf, arsip, item terhapus, atau slug yang tidak ada.
 *
 * Di-cache 60 detik dengan tag `item:<slug>` + `items` — `12-route-map.md` §11.
 * `getItemStatus` sengaja **tidak** di-cache: proxy harus melihat arsip segera.
 */
export async function getItemDetail(slug: string): Promise<ItemDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`item:${slug}`, "items");

  const item = await prisma.item.findUnique({ where: { slug }, select: detailSelect });

  if (!item || item.status !== "PUBLISHED" || !item.publishedAt) return null;

  return {
    slug: item.slug,
    title: item.title,
    type: item.type,
    shortDescription: item.shortDescription,
    description: item.description,
    howItWorks: item.howItWorks,
    license: item.license,
    demoUrl: item.demoUrl,
    priceIdr: item.priceIdr,
    noAdsPriceIdr: item.noAdsPriceIdr,
    releasedAt: item.releasedAt,
    publishedAt: item.publishedAt,
    downloadCount: item.downloadCount,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    category: item.category,
    thumbnail: item.thumbnail
      ? {
          url: mediaUrl(item.thumbnail.key) ?? "",
          alt: item.thumbnail.alt,
          width: item.thumbnail.width,
          height: item.thumbnail.height,
        }
      : null,
    technologies: item.technologies.map((link) => link.technology),
    features: item.features,
    steps: item.steps,
    screenshots: item.screenshots.flatMap((shot) => {
      const url = mediaUrl(shot.media.key);
      if (!url) return [];
      return [
        {
          url,
          alt: shot.media.alt,
          caption: shot.caption,
          width: shot.media.width,
          height: shot.media.height,
        },
      ];
    }),
  };
}
