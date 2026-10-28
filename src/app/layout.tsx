import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";

import { OrganizationJsonLd } from "@/components/seo/organization-jsonld";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.reditech.id"),
  title: {
    default: "Reditech — Source code siap pakai untuk developer Indonesia",
    template: "%s · Reditech",
  },
  description:
    "Katalog source code siap pakai: unduh gratis lewat iklan, atau beli tanpa iklan dengan riwayat unduhan dan invoice.",
  applicationName: "Reditech",
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "Reditech",
    title: "Reditech — Source code siap pakai untuk developer Indonesia",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reditech — Source code siap pakai untuk developer Indonesia",
  },
};

export const viewport: Viewport = {
  themeColor: "#58d3db",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={openSans.variable}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {children}
        <OrganizationJsonLd />
        <Toaster />
      </body>
    </html>
  );
}
