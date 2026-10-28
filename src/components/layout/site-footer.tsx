import Link from "next/link";

import { Container } from "@/components/layout/container";
import { getCopyrightYear } from "@/lib/site";

const columns = [
  {
    title: "Jelajahi",
    links: [
      { href: "/source-code", label: "Source Code" },
      { href: "/tutorial", label: "Tutorial" },
      { href: "/donasi", label: "Sponsor" },
    ],
  },
  {
    title: "Layanan",
    links: [
      { href: "/jasa-pembuatan-website", label: "Jasa Pembuatan Website" },
      { href: "/request-aplikasi", label: "Request Aplikasi" },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { href: "/kontak", label: "Kontak" },
      { href: "/kebijakan-privasi", label: "Kebijakan Privasi" },
      { href: "/syarat-ketentuan", label: "Syarat & Ketentuan" },
    ],
  },
];

export async function SiteFooter() {
  const year = await getCopyrightYear();

  return (
    <footer className="mt-24 border-t border-border">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <p className="text-lg font-semibold tracking-tight">Reditech</p>
          <p className="max-w-[36ch] text-sm text-muted-foreground">
            Source code siap pakai untuk developer Indonesia. Gratis lewat iklan, atau
            berbayar tanpa iklan.
          </p>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title} className="space-y-3">
            <p className="text-sm font-semibold">{column.title}</p>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>

      <Container className="border-t border-border py-6">
        <p className="text-xs text-muted-foreground">
          © {year} Reditech. Seluruh hak cipta dilindungi.
        </p>
      </Container>
    </footer>
  );
}
