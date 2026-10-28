import { PrismaClient } from "@prisma/client";

/**
 * Satu instance Prisma per proses. Saat pengembangan, Next memuat ulang modul
 * pada setiap perubahan; tanpa cache di `globalThis` koneksi menumpuk sampai
 * PostgreSQL menolak koneksi baru.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
