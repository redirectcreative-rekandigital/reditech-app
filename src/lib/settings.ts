import { cacheLife, cacheTag } from "next/cache";

import { prisma } from "@/lib/prisma";

/**
 * Pengaturan situs (`03-data-model.md` §2, `09-superadmin-admin.md` tab
 * Pengaturan). Nilai disimpan sebagai JSON skalar; pembaca selalu memberi
 * nilai cadangan sehingga halaman tidak pernah gagal karena satu kunci hilang.
 *
 * Di-cache 1 jam dengan tag `settings`; admin memanggil `revalidateTag` setelah
 * menyimpan (M3).
 */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  try {
    const row = await prisma.setting.findUnique({ where: { key }, select: { value: true } });
    const value = row?.value;

    // Tipe harus sama dengan cadangan: nilai JSON yang salah bentuk diabaikan.
    return typeof value === typeof fallback ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Hitung mundur interstisial iklan (`Setting.ads.interstitialSeconds`). */
export async function getInterstitialSeconds(): Promise<number> {
  const value = await getSetting("ads.interstitialSeconds", 10);
  return Math.min(60, Math.max(3, Math.round(value)));
}

/** Batas unduhan per item per 24 jam (`Setting.security.downloadDailyLimit`). */
export async function getDailyDownloadLimit(): Promise<number> {
  const value = await getSetting("security.downloadDailyLimit", 5);
  return Math.min(50, Math.max(1, Math.round(value)));
}

/**
 * Interstisial dapat dimatikan admin (`Setting.ads.enabled`, FR-ADS-01).
 * Default aktif; nilai selain `false` dianggap aktif.
 */
export async function getAdsEnabled(): Promise<boolean> {
  return (await getSetting("ads.enabled", true)) !== false;
}
