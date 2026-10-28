import { createDriveProvider, driveConfigured } from "./drive";
import { createLocalProvider, localRoot } from "./local";
import type { StorageProvider } from "./types";

export { StorageError } from "./types";
export type { StorageProvider, StoredFile } from "./types";
export { localRoot };

/**
 * Pemilihan provider: `STORAGE_DRIVER` menang bila diisi; tanpa itu Drive
 * dipakai hanya jika kredensialnya lengkap, selebihnya sistem berkas lokal.
 */
export function getStorage(): StorageProvider {
  const driver = process.env.STORAGE_DRIVER?.toLowerCase();

  if (driver === "drive") return createDriveProvider();
  if (driver === "local") return createLocalProvider();

  return driveConfigured() ? createDriveProvider() : createLocalProvider();
}

/** Untuk `/api/health` dan peringatan admin. */
export function storageStatus(): "drive" | "local" {
  return getStorage().name === "google-drive" ? "drive" : "local";
}
