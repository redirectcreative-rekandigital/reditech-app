import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CatalogSkeleton } from "@/components/catalog/catalog-skeleton";
import { FilterBar } from "@/components/catalog/filter-bar";
import { ItemCard } from "@/components/catalog/item-card";
import { Pagination } from "@/components/catalog/pagination";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui-ext/button";
import {
  CATALOG_PAGE_SIZE,
  catalogHref,
  getCatalogCategories,
  getCatalogPage,
  parseCatalogFilters,
} from "@/lib/catalog";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const filters = parseCatalogFilters(await searchParams);

  return {
    title: filters.search ? `Cari “${filters.search}” di katalog` : "Katalog source code",
    description:
      "Jelajahi source code siap pakai untuk developer Indonesia. Filter berdasarkan tipe, kategori, dan urutkan sesuai kebutuhan.",
    alternates: { canonical: catalogHref(filters) },
  };
}

export default function Page({ searchParams }: PageProps) {
  return (
    <Container className="py-10">
      <header className="max-w-prose">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Katalog
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Source code siap pakai
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Unduh gratis lewat halaman iklan, atau beli tanpa iklan untuk mendapat riwayat
          unduhan dan invoice. Semua filter tersimpan di URL, jadi hasil bisa dibagikan apa
          adanya.
        </p>
      </header>

      <div className="mt-8">
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogResults searchParams={searchParams} />
        </Suspense>
      </div>
    </Container>
  );
}

async function CatalogResults({ searchParams }: PageProps) {
  const filters = parseCatalogFilters(await searchParams);

  // `page` tidak sah atau di luar rentang sudah dialihkan proxy dengan 308
  // sebelum shell PPR dikirim; `permanentRedirect` di sini hanya akan menjadi
  // pengalihan sisi klien dengan status 200. Lihat `12-route-map.md` 12.
  const [page, categories] = await Promise.all([
    getCatalogPage(filters),
    getCatalogCategories(),
  ]);

  const from = page.cards.length === 0 ? 0 : (filters.page - 1) * CATALOG_PAGE_SIZE + 1;
  const to = page.cards.length === 0 ? 0 : from + page.cards.length - 1;

  return (
    <div className="flex flex-col gap-8">
      <FilterBar
        filters={filters}
        categories={categories}
        result={{ from, to, total: page.total }}
      />

      {page.cards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong bg-card px-6 py-12 text-center">
          <p className="text-base font-semibold">Tidak ada source code yang cocok.</p>
          <p className="mx-auto mt-2 max-w-prose text-sm text-muted-foreground">
            Coba kata kunci yang lebih pendek, atau longgarkan filter tipe dan kategori.
            Katalog ini terus bertambah — usulkan aplikasi yang Anda butuhkan bila belum ada.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/source-code">Hapus pencarian</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/request-aplikasi">Usulkan aplikasi</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <ul className="grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {page.cards.map((item) => (
              <li key={item.slug}>
                <ItemCard item={item} />
              </li>
            ))}
          </ul>

          <Pagination filters={filters} page={filters.page} totalPages={page.totalPages} />
        </>
      )}
    </div>
  );
}
