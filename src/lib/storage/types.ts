/** Berkas yang siap dialirkan ke respons HTTP. */
export type StoredFile = {
  body: ReadableStream<Uint8Array>;
  sizeBytes: number | null;
  contentType: string | null;
};

/**
 * Abstraksi penyimpanan berkas item (`00-tech-stack.md`): Google Drive untuk
 * produksi, sistem berkas lokal untuk pengembangan. Yang masuk database hanya
 * *key*; URL Drive tidak pernah sampai ke browser (FR-DL-05).
 */
export type StorageProvider = {
  readonly name: "google-drive" | "local";
  /** `false` untuk Drive `alt=media`: klien diberi `Accept-Ranges: none`. */
  readonly supportsRange: boolean;
  open(key: string): Promise<StoredFile>;
};

export class StorageError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "StorageError";
  }
}
