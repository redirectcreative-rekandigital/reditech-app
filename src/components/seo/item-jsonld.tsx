import type { ItemDetail } from "@/lib/items";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/** URL absolut — `image` di JSON-LD tidak menerima path relatif. */
function absolute(url: string): string {
  return url.startsWith("http") ? url : `${SITE_URL}${url}`;
}

/**
 * JSON-LD `Product` + `BreadcrumbList` untuk halaman detail —
 * `02-requirements.md` FR-SEO-04 dan `12-route-map.md` 10.
 *
 * Harga memakai `priceIdr`; item gratis dilaporkan `0` agar `offers` tetap sah.
 * Ulasan belum ada di M1, jadi `aggregateRating` sengaja tidak dikarang.
 */
export function ItemJsonLd({ item }: { item: ItemDetail }) {
  const url = `${SITE_URL}/source-code/${item.slug}`;
  const images = [
    ...new Set(
      [item.thumbnail?.url, ...item.screenshots.map((shot) => shot.url)].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  ].map(absolute);

  const price = item.type === "PREMIUM" ? item.priceIdr : 0;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${url}#product`,
        name: item.title,
        description: item.shortDescription,
        url,
        sku: item.slug,
        brand: { "@type": "Brand", name: SITE_NAME },
        ...(item.category ? { category: item.category.name } : {}),
        ...(images.length > 0 ? { image: images } : {}),
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: "IDR",
          price: String(price ?? 0),
          availability: "https://schema.org/InStock",
          ...(item.publishedAt ? { availabilityStarts: item.publishedAt.toISOString() } : {}),
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Beranda", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Source code",
            item: `${SITE_URL}/source-code`,
          },
          { "@type": "ListItem", position: 3, name: item.title, item: url },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // `<` di-escape supaya judul tidak bisa menutup tag script lebih awal.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
