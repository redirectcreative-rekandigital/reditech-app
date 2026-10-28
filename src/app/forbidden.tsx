import { ForbiddenView } from "@/components/system/forbidden-view";

/**
 * Jaring pengaman bila `requireCapability()` gagal di tengah render (mis. peran
 * dicabut saat sesi masih hidup). Jalur utama `403` ditentukan proxy, karena
 * setelah shell PPR terkirim status tidak bisa diubah lagi.
 */
export default function Forbidden() {
  return <ForbiddenView />;
}
