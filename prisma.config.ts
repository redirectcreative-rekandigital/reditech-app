import { defineConfig } from "prisma/config";

/**
 * Prisma 6 tidak lagi memuat `.env` otomatis ketika memakai file konfigurasi.
 * Di lokal file itu ada; di CI/produksi variabel datang dari environment
 * (Docker `env_file`), jadi kegagalan muat diabaikan.
 */
try {
  process.loadEnvFile();
} catch {
  // Tidak ada .env — pakai environment yang sudah tersedia.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
