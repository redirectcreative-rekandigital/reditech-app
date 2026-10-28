import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * JSON-LD `Organization` di root (`12-route-map.md` 10).
 * Sengaja tanpa `headers()`, agar root layout tetap bisa dirender sebagai
 * shell statis (Cache Components tidak bisa memberi nonce pada HTML statis).
 */
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "Katalog source code siap pakai untuk developer Indonesia: unduh gratis lewat iklan atau beli tanpa iklan.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${SITE_URL}/kontak`,
      availableLanguage: ["id"],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
