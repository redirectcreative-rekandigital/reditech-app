import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Riwayat konten (`09-superadmin-admin.md` §7, FR-ADM-16). Versi selalu naik
 * dan tidak pernah ditimpa; "Restore" membuat versi baru dari snapshot lama.
 */
export async function recordRevision({
  entityType,
  entityId,
  snapshot,
  createdById,
}: {
  entityType: "item" | "tutorial" | "setting";
  entityId: string;
  snapshot: Prisma.InputJsonValue;
  createdById: string;
}): Promise<void> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const last = await prisma.revision.findFirst({
      where: { entityType, entityId },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    try {
      await prisma.revision.create({
        data: {
          entityType,
          entityId,
          version: (last?.version ?? 0) + 1,
          snapshot,
          createdById,
        },
      });
      return;
    } catch (error) {
      // Tabrakan versi (dua penyimpanan hampir bersamaan): ulangi sekali.
      if (attempt === 1) throw error;
    }
  }
}

export async function listRevisions(entityType: string, entityId: string, take = 20) {
  return prisma.revision.findMany({
    where: { entityType, entityId },
    orderBy: { version: "desc" },
    take,
    select: {
      id: true,
      version: true,
      createdAt: true,
      createdBy: { select: { email: true } },
    },
  });
}

export async function getRevision(id: string) {
  return prisma.revision.findUnique({ where: { id } });
}
