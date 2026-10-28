import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/api"],
    },
    sitemap: "https://www.reditech.id/sitemap.xml",
    host: "https://www.reditech.id",
  };
}
