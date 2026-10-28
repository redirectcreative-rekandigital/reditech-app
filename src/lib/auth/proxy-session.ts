import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";

/**
 * Pembacaan sesi ringan untuk proxy. Proxy berjalan di runtime Node.js dan
 * sudah memuat modul katalog (yang juga memakai Prisma), jadi satu kueri
 * tambahan per permintaan `/admin/*` masih murah — dan hanya itulah cara
 * mendapatkan status `307`/`403` yang sebenarnya sebelum shell PPR terkirim.
 *
 * Modul ini **tidak** mengimpor `next/headers` supaya aman dipakai di proxy.
 */
export type ProxySessionActor = {
  userId: string;
  role: "VISITOR" | "USER" | "ADMIN" | "SUPERADMIN";
  permissions: string[];
  mfaEnabled: boolean;
};

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function sessionActorForToken(token: string): Promise<ProxySessionActor | null> {
  const session = await prisma.session.findUnique({
    where: { sessionToken: hashSessionToken(token) },
    select: {
      expires: true,
      user: {
        select: {
          id: true,
          role: true,
          permissions: true,
          status: true,
          mfaEnabled: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.expires.getTime() <= Date.now()) return null;
  if (session.user.status !== "ACTIVE") return null;

  return {
    userId: session.user.id,
    role: session.user.role,
    permissions: session.user.permissions,
    mfaEnabled: session.user.mfaEnabled,
  };
}
