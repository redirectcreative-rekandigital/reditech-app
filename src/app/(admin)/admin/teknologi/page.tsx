import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TaxonomyManager, type TaxonomyRow } from "@/components/admin/taxonomy-manager";
import { requireCapability } from "@/lib/auth/actor";
import { can } from "@/lib/auth/permissions";
import { formatCount } from "@/lib/format";
import { prisma } from "@/lib/prisma";

// Halaman panel membaca sesi per permintaan; jangan diprerender sebagai shell.
export const instant = false;

export const metadata: Metadata = {
  title: "Teknologi",
};

/** Teknologi untuk filter katalog dan tag tutorial (`09 §6.2`). */
export default async function Page() {
  const actor = await requireCapability("taxonomy:read");

  const technologies = await prisma.technology.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { items: true, tutorials: true } },
    },
  });

  const rows: TaxonomyRow[] = technologies.map((technology) => {
    const { items, tutorials } = technology._count;
    const usage =
      items === 0 && tutorials === 0
        ? "Belum dipakai"
        : [
            items > 0 ? `${formatCount(items)} item` : null,
            tutorials > 0 ? `${formatCount(tutorials)} tutorial` : null,
          ]
            .filter(Boolean)
            .join(" · ");

    return {
      id: technology.id,
      name: technology.name,
      slug: technology.slug,
      usage,
      blockedReason:
        items + tutorials > 0
          ? `Tidak bisa dihapus: masih dipakai ${[
              items > 0 ? `${formatCount(items)} item` : null,
              tutorials > 0 ? `${formatCount(tutorials)} tutorial` : null,
            ]
              .filter(Boolean)
              .join(" dan ")}.`
          : null,
    };
  });

  const used = rows.filter((row) => row.blockedReason !== null).length;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Teknologi"
        description="Tag teknologi untuk filter katalog dan artikel tutorial. Nama tampil di UI; slug dipakai di URL filter."
        meta={
          <>
            <span>
              <strong>{formatCount(rows.length)}</strong> teknologi
            </span>
            <span>
              <strong>{formatCount(used)}</strong> dipakai konten
            </span>
          </>
        }
      />

      <TaxonomyManager
        kind="technology"
        rows={rows}
        canWrite={can(actor, "taxonomy:write")}
        canDelete={can(actor, "taxonomy:delete")}
      />
    </div>
  );
}
