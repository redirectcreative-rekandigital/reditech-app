import { createHash, randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

import { SESSION_COOKIE } from "./cookies";

/**
 * Sesi database (`03-data-model.md` model `Session`).
 *
 * Cookie hanya menyimpan token acak 256 bit; database menyimpan hash sha256-nya.
 * Bentuk tabel sama dengan yang dipakai Auth.js, tetapi pemeriksaannya dilakukan
 * sendiri agar sesi bisa dicabut seketika (FR-AUTH-06) dan agar MFA/step-up
 * tidak bergantung pada strategi JWT.
 */
export { SESSION_COOKIE };

/** Sesi pengguna biasa: 30 hari (FR-AUTH-03). */
export const USER_SESSION_SECONDS = 30 * 24 * 60 * 60;

/** Sesi admin: 8 jam, sesuai idle timeout panel (`09-superadmin-admin.md` §8). */
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;

const PRODUCTION = process.env.NODE_ENV === "production";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: "VISITOR" | "USER" | "ADMIN" | "SUPERADMIN";
  permissions: string[];
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  mfaEnabled: boolean;
  mfaSecretEnc: string | null;
  passwordHash: string | null;
};

export async function createSession(
  userId: string,
  { ttlSeconds = USER_SESSION_SECONDS, ipHash, userAgent }: {
    ttlSeconds?: number;
    ipHash?: string | null;
    userAgent?: string | null;
  } = {},
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + ttlSeconds * 1000);

  await prisma.session.create({
    data: {
      sessionToken: hashToken(token),
      userId,
      expires,
      ipHash: ipHash ?? null,
      userAgent: userAgent?.slice(0, 300) ?? null,
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: PRODUCTION,
    sameSite: "lax",
    path: "/",
    expires,
  });

  return token;
}

/** Sesi aktif untuk cookie saat ini, atau `null`. */
export async function readSession(): Promise<{ sessionId: string; user: SessionUser } | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken: hashToken(token) },
    select: {
      id: true,
      expires: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          permissions: true,
          status: true,
          mfaEnabled: true,
          mfaSecretEnc: true,
          passwordHash: true,
        },
      },
    },
  });

  if (!session) return null;

  if (session.expires.getTime() <= Date.now() || session.user.status !== "ACTIVE") {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return { sessionId: session.id, user: session.user };
}

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session
      .deleteMany({ where: { sessionToken: hashToken(token) } })
      .catch(() => undefined);
  }

  store.delete(SESSION_COOKIE);
}

/** Dipakai saat suspend/pengguna berubah peran: semua sesi lama mati. */
export async function destroyUserSessions(userId: string, exceptId?: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId, ...(exceptId ? { id: { not: exceptId } } : {}) },
  });
}
