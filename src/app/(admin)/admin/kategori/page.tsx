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
  title: "Kategori",
};

/**
 * Kategori katalog (`09-superadmin-admin.md` §6.2). Halaman hanya menyiapkan
 * data; seluruh mutasi ada di Server Action yang memeriksa kapabilitas sendiri.
 */
export default async function Page() {
  // Guard per halaman: layout tidak menghentikan render segmen lain, jadi
  // otorisasi tidak boleh bergantung pada layout (09-superadmin-admin.md 8).
  const actor = await requireCapability("taxonomy:read");

  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      order: true,
      isActive: true,
      _count: { select: { items: true } },
    },
  });

  const rows: TaxonomyRow[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    order: category.order,
    isActive: category.isActive,
    usage:
      category._count.items === 0
        ? "Belum dipakai"
        : `${formatCount(category._count.items)} item`,
    blockedReason:
      category._count.items > 0
        ? `Tidak bisa dihapus: masih dipakai ${formatCount(category._count.items)} item.`
        : null,
  }));

  const active = rows.filter((row) => row.isActive).length;
  const used = categories.filter((category) => category._count.items > 0).length;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Kategori"
        description="Chip filter katalog. Urutan menentukan posisi tampil; kategori nonaktif tetap tersimpan tetapi tidak muncul di katalog publik."
        meta={
          <>
            <span>
              <strong>{formatCount(rows.length)}</strong> kategori
            </span>
            <span>
              <strong>{formatCount(active)}</strong> aktif
            </span>
            <span>
              <strong>{formatCount(used)}</strong> dipakai item
            </span>
          </>
        }
      />

      <TaxonomyManager
        kind="category"
        rows={rows}
        canWrite={can(actor, "taxonomy:write")}
        canDelete={can(actor, "taxonomy:delete")}
      />
    </div>
  );
}
