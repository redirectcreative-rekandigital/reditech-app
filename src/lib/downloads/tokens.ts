import { prisma } from "@/lib/prisma";

import { createDownloadTokenValue, hashDownloadToken } from "./gate";

/** Umur token unduhan (FR-DL-04). */
export const TOKEN_TTL_MINUTES = 5;

export type IssuedDownloadToken = {
  raw: string;
  expiresAt: Date;
  href: string;
};

/**
 * Menerbitkan token sekali pakai. Yang disimpan hanya hash sha256 —
 * nilai mentah tidak pernah masuk database atau log.
 */
export async function issueDownloadToken({
  itemId,
  purpose,
  userId,
  sessionId,
  ipHash,
}: {
  itemId: string;
  purpose: "FREE_AD" | "PREMIUM";
  userId: string | null;
  sessionId: string | null;
  ipHash: string | null;
}): Promise<IssuedDownloadToken> {
  const raw = createDownloadTokenValue();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.downloadToken.create({
    data: {
      tokenHash: hashDownloadToken(raw),
      itemId,
      purpose,
      userId,
      downloadSessionId: sessionId,
      ipHash,
      expiresAt,
      maxUses: 1,
    },
  });

  return { raw, expiresAt, href: `/api/download/file/${raw}` };
}

export const tokenSelect = {
  id: true,
  itemId: true,
  userId: true,
  purpose: true,
  expiresAt: true,
  maxUses: true,
  uses: true,
  ipHash: true,
  createdAt: true,
  item: {
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      status: true,
      deletedAt: true,
      driveFileId: true,
      driveFileSize: true,
    },
  },
} as const;

export type ResolvedDownloadToken = {
  id: string;
  itemId: string;
  userId: string | null;
  purpose: "FREE_AD" | "PREMIUM";
  expiresAt: Date;
  maxUses: number;
  uses: number;
  item: {
    id: string;
    slug: string;
    title: string;
    type: "FREE" | "PREMIUM";
    status: string;
    deleted: boolean;
    fileKey: string | null;
    fileSize: number | null;
  };
};

export async function resolveDownloadToken(raw: string): Promise<ResolvedDownloadToken | null> {
  const token = await prisma.downloadToken.findUnique({
    where: { tokenHash: hashDownloadToken(raw) },
    select: tokenSelect,
  });

  if (!token) return null;

  return {
    id: token.id,
    itemId: token.itemId,
    userId: token.userId,
    purpose: token.purpose,
    expiresAt: token.expiresAt,
    maxUses: token.maxUses,
    uses: token.uses,
    item: {
      id: token.item.id,
      slug: token.item.slug,
      title: token.item.title,
      type: token.item.type,
      status: token.item.status,
      deleted: Boolean(token.item.deletedAt),
      fileKey: token.item.driveFileId,
      fileSize: token.item.driveFileSize === null ? null : Number(token.item.driveFileSize),
    },
  };
}

/**
 * Klaim token secara atomik **sebelum** stream dimulai. Dua permintaan paralel
 * dengan token yang sama tidak bisa sama-sama lolos; yang kalah mendapat `false`
 * dan diperlakukan sebagai token terpakai (410).
 */
export async function claimDownloadToken(id: string): Promise<boolean> {
  const result = await prisma.downloadToken.updateMany({
    where: { id, uses: { lt: 1 } },
    data: { uses: { increment: 1 }, usedAt: new Date() },
  });

  return result.count === 1;
}

export function tokenUsable(token: { expiresAt: Date; uses: number; maxUses: number }): boolean {
  return token.uses < token.maxUses && token.expiresAt.getTime() > Date.now();
}
