import { prisma } from "@/lib/prisma";

/** Ringkasan item yang dibutuhkan jalur unduhan; tanpa data yang tak dipakai. */
export type DownloadItem = {
  id: string;
  slug: string;
  title: string;
  type: "FREE" | "PREMIUM";
  /** `PUBLISHED` | `ARCHIVED` | ... */
  status: string;
  deleted: boolean;
  fileKey: string | null;
  fileSize: number | null;
};

export async function getDownloadItem(slug: string): Promise<DownloadItem | null> {
  const item = await prisma.item.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      status: true,
      deletedAt: true,
      driveFileId: true,
      driveFileSize: true,
      publishedAt: true,
    },
  });

  if (!item) return null;

  const visible = item.status === "PUBLISHED" && !item.deletedAt && Boolean(item.publishedAt);
  if (!visible && item.status !== "ARCHIVED") return null;

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    type: item.type,
    status: item.status,
    deleted: Boolean(item.deletedAt),
    fileKey: item.driveFileId,
    fileSize: item.driveFileSize === null ? null : Number(item.driveFileSize),
  };
}

/**
 * Entitlement aktif (INV-06: satu baris aktif per pengguna+item). Auth.js baru
 * ada di M4; sampai saat itu `userId` selalu `null` dan jalur premium berakhir
 * di halaman pembelian.
 */
export async function hasActiveEntitlement(
  userId: string | null,
  itemId: string,
): Promise<boolean> {
  if (!userId) return false;

  const entitlement = await prisma.entitlement.findFirst({
    where: { userId, itemId, revokedAt: null },
    select: { id: true },
  });

  return entitlement !== null;
}
