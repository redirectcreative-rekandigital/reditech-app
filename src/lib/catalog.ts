import { Prisma } from "@prisma/client";
import { cacheLife, cacheTag } from "next/cache";

import { mediaUrl } from "@/lib/media";
import { prisma } from "@/lib/prisma";

export const CATALOG_PAGE_SIZE = 12;

export type CatalogSort = "newest" | "popular" | "oldest";
export type CatalogType = "FREE" | "PREMIUM";

export type CatalogFilters = {
  search: string | null;
  type: CatalogType | null;
  kategori: string | null;
  sort: CatalogSort;
  /** `0` menandakan nilai `page` tidak sah; pemanggil wajib mengalihkan ke halaman 1. */
  page: number;
};

export const CATALOG_SORT_OPTIONS: Array<{ value: CatalogSort; label: string }> = [
  { value: "newest", label: "Terbaru" },
  { value: "popular", label: "Terpopuler" },
  { value: "oldest", label: "Terlama" },
];

export const CATALOG_TYPE_OPTIONS: Array<{ value: CatalogType | null; label: string }> = [
  { value: null, label: "Semua" },
  { value: "FREE", label: "Gratis" },
  { value: "PREMIUM", label: "Premium" },
];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PAGE_PATTERN = /^[1-9]\d{0,4}$/;
const MAX_SEARCH_LENGTH = 100;

type SearchParamsInput = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Menormalkan query string — `02-requirements.md` FR-CAT-03..09.
 * Nilai yang tidak sah tidak melempar error: `type`/`sort` kembali ke default,
 * `kategori` yang bukan slug diabaikan, dan `page` tidak sah jadi `0`.
 */
export function parseCatalogFilters(params: SearchParamsInput): CatalogFilters {
  const search = (firstValue(params.search) ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_SEARCH_LENGTH);
  // `type` tidak peka huruf besar-kecil; canonical selalu menulis `FREE`/`PREMIUM`.
  const type = firstValue(params.type)?.toUpperCase();
  const kategori = firstValue(params.kategori);
  const sort = firstValue(params.sort);
  const page = firstValue(params.page);

  return {
    search: search.length > 0 ? search : null,
    type: type === "FREE" || type === "PREMIUM" ? type : null,
    kategori: kategori && SLUG_PATTERN.test(kategori) ? kategori : null,
    sort: sort === "popular" || sort === "oldest" ? sort : "newest",
    page: page === undefined ? 1 : PAGE_PATTERN.test(page) ? Number(page) : 0,
  };
}

/**
 * URL katalog dengan kunci parameter **urut abjad** (kategori, page, search,
 * sort, type) — FR-CAT-12. Halaman 1 dan urutan `newest` tidak ditulis, agar
 * satu keadaan hanya punya satu URL.
 */
export function catalogHref(
  filters: CatalogFilters,
  overrides: Partial<CatalogFilters> = {},
): string {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (merged.kategori) params.set("kategori", merged.kategori);
  if (merged.page > 1) params.set("page", String(merged.page));
  if (merged.search) params.set("search", merged.search);
  if (merged.sort !== "newest") params.set("sort", merged.sort);
  if (merged.type) params.set("type", merged.type);

  const query = params.toString();
  return query ? `/source-code?${query}` : "/source-code";
}

// ─────────────────────────── Query ───────────────────────────

/**
 * Pencarian memakai `websearch_to_tsquery` + kemiripan trigram
 * (`03-data-model.md` §4), bukan `LIKE`, agar bentuk kata tetap cocok.
 * Semua nilai masuk sebagai parameter; tidak ada string SQL yang dirakit
 * dari input pengguna.
 */
function buildWhere(filters: CatalogFilters): Prisma.Sql {
  const parts: Prisma.Sql[] = [
    Prisma.sql`i."status" = 'PUBLISHED'::"ContentStatus"`,
    Prisma.sql`i."deletedAt" IS NULL`,
  ];

  if (filters.type) {
    parts.push(Prisma.sql`i."type" = ${filters.type}::"ItemType"`);
  }

  if (filters.kategori) {
    parts.push(Prisma.sql`c."slug" = ${filters.kategori} AND c."isActive" = true`);
  }

  if (filters.search) {
    // `websearch_to_tsquery` untuk bentuk kata, `word_similarity` untuk salah
    // ketik ringan (FR-CAT-14): "kasirr" masih cocok dengan "Kasir" di judul.
    parts.push(Prisma.sql`(
      to_tsvector('indonesian'::regconfig, i."title" || ' ' || i."shortDescription")
        @@ websearch_to_tsquery('indonesian'::regconfig, ${filters.search})
      OR word_similarity(${filters.search}, i."title") > 0.5
    )`);
  }

  return Prisma.join(parts, " AND ");
}

function buildOrder(filters: CatalogFilters): Prisma.Sql {
  if (filters.search) {
    return Prisma.sql`ORDER BY
      ts_rank(
        to_tsvector('indonesian'::regconfig, i."title" || ' ' || i."shortDescription"),
        websearch_to_tsquery('indonesian'::regconfig, ${filters.search})
      ) DESC,
      word_similarity(${filters.search}, i."title") DESC,
      i."publishedAt" DESC,
      i."id" ASC`;
  }

  if (filters.sort === "popular") {
    return Prisma.sql`ORDER BY i."downloadCount" DESC, i."publishedAt" DESC, i."id" ASC`;
  }

  if (filters.sort === "oldest") {
    return Prisma.sql`ORDER BY i."publishedAt" ASC, i."id" ASC`;
  }

  // `id` menjadi pemecah seri agar dua item bertanggal sama tidak bertukar
  // posisi antar-permintaan (FR-CAT-06 menuntut urutan deterministik).
  return Prisma.sql`ORDER BY i."publishedAt" DESC, i."id" ASC`;
}

async function countCatalog(filters: CatalogFilters): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT count(*) AS count
    FROM "items" i
    LEFT JOIN "categories" c ON c."id" = i."categoryId"
    WHERE ${buildWhere(filters)}
  `;

  return Number(rows[0]?.count ?? 0);
}

/**
 * Dipakai proxy untuk memvalidasi `page` sebelum HTML dirender: begitu shell
 * PPR terkirim, `permanentRedirect` di halaman hanya jadi pengalihan sisi klien
 * dan status HTTP-nya sudah 200. Lihat `12-route-map.md` 12.
 */
export async function countCatalogForFilters(filters: CatalogFilters): Promise<number> {
  return countCatalog(filters);
}

/** Jumlah halaman minimum 1 supaya `page=1` pada katalog kosong tetap sah. */
export function catalogTotalPages(total: number): number {
  return Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
}

async function selectCatalogIds(filters: CatalogFilters, page: number): Promise<string[]> {
  const offset = (page - 1) * CATALOG_PAGE_SIZE;

  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT i."id"
    FROM "items" i
    LEFT JOIN "categories" c ON c."id" = i."categoryId"
    WHERE ${buildWhere(filters)}
    ${buildOrder(filters)}
    LIMIT ${CATALOG_PAGE_SIZE} OFFSET ${offset}
  `;

  return rows.map((row) => row.id);
}

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  type: true,
  shortDescription: true,
  priceIdr: true,
  noAdsPriceIdr: true,
  downloadCount: true,
  publishedAt: true,
  category: { select: { name: true, slug: true } },
  thumbnail: { select: { key: true, alt: true, width: true, height: true } },
  technologies: { select: { technology: { select: { name: true, slug: true } } } },
} satisfies Prisma.ItemSelect;

export type CatalogCard = {
  slug: string;
  title: string;
  type: CatalogType;
  shortDescription: string;
  priceIdr: number | null;
  noAdsPriceIdr: number | null;
  downloadCount: number;
  publishedAt: Date | null;
  category: { name: string; slug: string } | null;
  technologies: Array<{ name: string; slug: string }>;
  thumbnail: { url: string; alt: string; width: number; height: number } | null;
};

export type CatalogPage = {
  cards: CatalogCard[];
  total: number;
  totalPages: number;
};

type CardRow = Prisma.ItemGetPayload<{ select: typeof cardSelect }>;

function toCard(row: CardRow): CatalogCard {
  return {
    slug: row.slug,
    title: row.title,
    type: row.type,
    shortDescription: row.shortDescription,
    priceIdr: row.priceIdr,
    noAdsPriceIdr: row.noAdsPriceIdr,
    downloadCount: row.downloadCount,
    publishedAt: row.publishedAt,
    category: row.category,
    technologies: row.technologies.map((link) => link.technology),
    thumbnail: row.thumbnail
      ? {
          url: mediaUrl(row.thumbnail.key) ?? "",
          alt: row.thumbnail.alt,
          width: row.thumbnail.width,
          height: row.thumbnail.height,
        }
      : null,
  };
}

/**
 * Satu halaman katalog. Urutan id ditentukan SQL (FTS/trigram/waktu), lalu
 * baris dihidrasi lewat Prisma dan disusun ulang sesuai urutan itu.
 */
export async function getCatalogPage(filters: CatalogFilters): Promise<CatalogPage> {
  const page = Math.max(1, filters.page);
  const [total, ids] = await Promise.all([
    countCatalog(filters),
    selectCatalogIds(filters, page),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  if (ids.length === 0) {
    return { cards: [], total, totalPages };
  }

  const rows = await prisma.item.findMany({ where: { id: { in: ids } }, select: cardSelect });
  const byId = new Map(rows.map((row) => [row.id, row]));

  const cards = ids.flatMap((id) => {
    const row = byId.get(id);
    return row ? [toCard(row)] : [];
  });

  return { cards, total, totalPages };
}

/**
 * Item unggulan beranda (S01). Di-cache 60 detik dengan tag `items` — sama
 * dengan `revalidate 60` di `12-route-map.md`. Kegagalan database saat build
 * tidak boleh menggagalkan build: beranda turun ke keadaan "belum ada item
 * unggulan" dan menyegarkan diri pada permintaan berikutnya.
 */
export async function getFeaturedItems(limit = 3): Promise<CatalogCard[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("items");

  try {
    const rows = await prisma.item.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        featured: true,
        publishedAt: { not: null },
      },
      orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
      take: limit,
      select: cardSelect,
    });

    return rows.map(toCard);
  } catch {
    return [];
  }
}

/** Kategori aktif untuk chip katalog dan beranda; berubah sangat jarang. */
export async function getCatalogCategories(): Promise<Array<{ name: string; slug: string }>> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");

  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: { name: true, slug: true },
  });
}
