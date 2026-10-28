/**
 * Media disimpan di Cloudflare R2; yang masuk database hanya object key.
 * URL publik dirakit di server supaya domain CDN bisa diganti tanpa migrasi.
 *
 * Key yang diawali `/` adalah aset demo di `public/` (dipakai seed lokal);
 * key R2 tidak pernah diawali garis miring.
 */
export function mediaUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("/")) return key;

  const base = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");
  if (!base) return null;
  return `${base}/${key}`;
}

export type MediaSize = { width: number; height: number };

/** Rasio aman untuk `<Image fill>` agar layout tidak melompat. */
export function aspectRatio({ width, height }: MediaSize): number {
  if (!width || !height) return 16 / 10;
  return width / height;
}

/** Aset demo lokal tidak melewati optimizer (SVG, di luar R2). */
export function isLocalMedia(url: string): boolean {
  return url.startsWith("/");
}
