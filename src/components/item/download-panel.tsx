import Link from "next/link";

import { ShareButtons } from "@/components/item/share-buttons";
import { Badge } from "@/components/ui-ext/badge";
import { Button } from "@/components/ui-ext/button";
import { formatCount, formatDate, formatIdr } from "@/lib/format";
import type { ItemDetail } from "@/lib/items";
import { SITE_URL } from "@/lib/site";

/**
 * `DownloadSidebar` — FR-ITEM-02/06/07.
 * Celestial hanya punya satu warna aksi: CTA berbayar memakai `primary`,
 * jalur gratis turun menjadi tautan bergaris bawah.
 */
export function DownloadPanel({ item }: { item: ItemDetail }) {
  const isPremium = item.type === "PREMIUM";
  const shareUrl = `${SITE_URL}/source-code/${item.slug}`;
  const loginHref = `/login?redirect=${encodeURIComponent(`/source-code/${item.slug}`)}`;

  return (
    <aside
      aria-labelledby="unduh-judul"
      className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5 lg:sticky lg:top-24"
    >
      <div className="flex flex-col gap-2">
        <h2 id="unduh-judul" className="text-lg font-semibold tracking-tight">
          Download
        </h2>
        <Badge tone={isPremium ? "premium" : "free"}>
          {isPremium ? "Premium" : "Gratis"}
        </Badge>
        <p className="text-sm text-muted-foreground">
          {isPremium
            ? "Sekali bayar untuk satu domain. Termasuk pembaruan versi minor dan dukungan instalasi lewat email."
            : item.noAdsPriceIdr
              ? `Gratis dengan halaman iklan, atau ${formatIdr(item.noAdsPriceIdr)} untuk langsung ke Drive tanpa iklan.`
              : "Gratis dengan halaman iklan sebelum tautan unduhan terbuka."}
        </p>
      </div>

      {isPremium ? (
        <div className="flex flex-col gap-3">
          {item.priceIdr !== null ? (
            <p className="text-2xl font-semibold tracking-tight">
              {formatIdr(item.priceIdr)}
            </p>
          ) : null}
          <Button asChild size="lg" fullWidth>
            <Link href={loginHref}>Beli Source Code</Link>
          </Button>
          {item.demoUrl ? (
            <Button asChild variant="outline" fullWidth>
              <a href={item.demoUrl} target="_blank" rel="noopener noreferrer">
                Lihat demo
              </a>
            </Button>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Masuk diperlukan agar pembelian tersimpan di akun Anda.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Button asChild size="lg" fullWidth>
            <Link href={loginHref}>
              Download Tanpa Iklan
              {item.noAdsPriceIdr !== null ? ` — ${formatIdr(item.noAdsPriceIdr)}` : ""}
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Bayar QRIS, lalu tautan Drive terbuka langsung.
          </p>

          <Link
            href={`/download/${item.slug}/ads`}
            className="text-sm font-medium underline underline-offset-4 hover:text-muted-foreground focus-ring"
          >
            Download Gratis (lewat iklan)
          </Link>
          <p className="text-xs text-muted-foreground">
            Melewati halaman iklan dan hitung mundur sebelum tautan aktif.
          </p>
        </div>
      )}

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-border pt-4 text-sm">
        <dt className="text-muted-foreground">Teknologi</dt>
        <dd className="font-medium">
          {item.technologies.length > 0
            ? item.technologies.map((tech) => tech.name).join(", ")
            : "—"}
        </dd>

        <dt className="text-muted-foreground">Lisensi</dt>
        <dd className="font-medium">{item.license ?? "—"}</dd>

        <dt className="text-muted-foreground">Download</dt>
        <dd className="font-medium">{formatCount(item.downloadCount)}</dd>

        <dt className="text-muted-foreground">Rilis</dt>
        <dd className="font-medium">
          {item.releasedAt ? formatDate(item.releasedAt) : "—"}
        </dd>
      </dl>

      <div className="border-t border-border pt-4">
        <ShareButtons url={shareUrl} title={item.title} />
      </div>
    </aside>
  );
}
