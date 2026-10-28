import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { Readable } from "node:stream";

import { StorageError, type StorageProvider, type StoredFile } from "./types";

const CONTENT_TYPES: Record<string, string> = {
  ".zip": "application/zip",
  ".rar": "application/vnd.rar",
  ".7z": "application/x-7z-compressed",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

function root(): string {
  // Direktori berkas adalah data runtime (bukan aset build), jadi sengaja
  // tidak ditelusuri Turbopack.
  return resolve(/*turbopackIgnore: true*/ process.env.LOCAL_STORAGE_DIR ?? ".storage");
}

/**
 * Path absolut untuk key lokal; menolak key yang keluar dari direktori akar
 * (`..`, path absolut, atau backslash Windows).
 */
export function localPath(key: string): string {
  if (!key || key.startsWith("/") || key.includes("\\") || key.split("/").includes("..")) {
    throw new StorageError(`Key penyimpanan tidak sah: ${key}`);
  }

  const base = root();
  const target = resolve(base, key);
  if (target !== base && !target.startsWith(base + sep)) {
    throw new StorageError(`Key penyimpanan keluar dari direktori: ${key}`);
  }

  return target;
}

export function localRoot(): string {
  return root();
}

/** Provider pengembangan: berkas di `LOCAL_STORAGE_DIR` (default `.storage`). */
export function createLocalProvider(): StorageProvider {
  return {
    name: "local",
    supportsRange: false,

    async open(key: string): Promise<StoredFile> {
      const path = localPath(key);

      let size: number;
      try {
        size = (await stat(/*turbopackIgnore: true*/ path)).size;
      } catch (error) {
        throw new StorageError(`Berkas lokal tidak ditemukan: ${key}`, error);
      }

      const node = createReadStream(/*turbopackIgnore: true*/ path);
      const body = Readable.toWeb(node) as ReadableStream<Uint8Array>;

      return {
        body,
        sizeBytes: size,
        contentType: CONTENT_TYPES[extname(path).toLowerCase()] ?? "application/octet-stream",
      };
    },
  };
}
