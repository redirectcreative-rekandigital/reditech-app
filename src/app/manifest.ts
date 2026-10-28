import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reditech — Source code siap pakai untuk developer Indonesia",
    short_name: "Reditech",
    description:
      "Katalog source code siap pakai: unduh gratis lewat iklan, atau beli tanpa iklan.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#58d3db",
    lang: "id",
    dir: "ltr",
    // `icons` 192/512 menyusul bersama logo; lihat prd/10-design-tokens.md §10.
  };
}
