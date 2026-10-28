import type { Prisma } from "@prisma/client";

import { requestMeta, type Actor } from "@/lib/auth/actor";
import { prisma } from "@/lib/prisma";

/**
 * `AdminAuditLog` append-only (`09-superadmin-admin.md` §7, FR-ADM-15).
 * Tabel menolak UPDATE/DELETE lewat trigger di migrasi `invariants`; fungsi ini
 * hanya menambah baris.
 *
 * `before`/`after` berisi diff terbatas pada field yang berubah, bukan snapshot
 * penuh, supaya log tetap terbaca dan tidak menyimpan rahasia.
 */
export async function recordAudit({
  actor,
  action,
  entityType,
  entityId,
  before,
  after,
  meta,
}: {
  actor: Pick<Actor, "id" | "email">;
  action: string;
  entityType: string;
  entityId: string;
  before?: Prisma.InputJsonValue | null;
  after?: Prisma.InputJsonValue | null;
  meta?: Awaited<ReturnType<typeof requestMeta>>;
}): Promise<void> {
  const context = meta ?? (await requestMeta());

  await prisma.adminAuditLog.create({
    data: {
      actorId: actor.id,
      actorEmail: actor.email,
      action,
      entityType,
      entityId,
      before: before ?? undefined,
      after: after ?? undefined,
      ip: context.ip,
      userAgent: context.userAgent,
      requestId: context.requestId,
    },
  });
}

/** Diff hanya untuk field yang nilainya benar-benar berubah. */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: T,
): { before: Partial<T>; after: Partial<T> } {
  const changedBefore: Partial<T> = {};
  const changedAfter: Partial<T> = {};

  for (const key of Object.keys(after) as Array<keyof T>) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changedBefore[key] = before[key];
      changedAfter[key] = after[key];
    }
  }

  return { before: changedBefore, after: changedAfter };
}
