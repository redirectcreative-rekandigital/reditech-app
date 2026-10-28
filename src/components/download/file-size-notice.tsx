import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatBytes } from "@/lib/format";

/** Ambang FR-DL-09: di atas 50 MB pengguna diberi tahu sebelum mulai. */
const LARGE_FILE_BYTES = 50 * 1024 * 1024;

/**
 * `FileSizeNotice` — `11-component-inventory.md` 8.
 * Menyebut konsekuensi, bukan hanya angka: provider unduhan tidak mendukung
 * `Range`, jadi koneksi yang terputus memaksa unduhan dimulai dari awal.
 * Dirender di S03 (panel) dan S04 (interstisial) sebelum berkas diminta.
 */
export function FileSizeNotice({
  sizeBytes,
  resumable,
}: {
  sizeBytes: number | null;
  resumable: boolean;
}) {
  if (!sizeBytes || sizeBytes <= 0) return null;

  const large = sizeBytes > LARGE_FILE_BYTES;

  return (
    <Alert role="note">
      <AlertTitle>
        {large
          ? `Berkas besar (${formatBytes(sizeBytes)}) — unduhan tidak dapat dilanjutkan`
          : `Ukuran berkas ${formatBytes(sizeBytes)}`}
      </AlertTitle>
      <AlertDescription>
        {large ? (
          <p>
            Berkas ini berukuran {formatBytes(sizeBytes)}. Unduhan dikirim sebagai satu aliran
            penuh, jadi bila koneksi terputus Anda harus memulai unduhan dari awal. Gunakan
            koneksi yang stabil sebelum menekan tombol unduh.
          </p>
        ) : resumable ? (
          <p>
            Berkas ini berukuran {formatBytes(sizeBytes)} dan dapat dilanjutkan bila koneksi
            terputus.
          </p>
        ) : (
          <p>
            Berkas ini berukuran {formatBytes(sizeBytes)} dan dikirim sebagai satu aliran penuh;
            unduhan tidak dapat dilanjutkan bila koneksi terputus.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
