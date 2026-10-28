import Link from "next/link";

import { Button } from "@/components/ui-ext/button";
import { Container } from "@/components/layout/container";

const nav = [
  { href: "/source-code", label: "Source Code" },
  { href: "/tutorial", label: "Tutorial" },
  { href: "/donasi", label: "Sponsor" },
  { href: "/jasa-pembuatan-website", label: "Jasa" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
      <Container className="flex h-16 items-center gap-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight"
          aria-label="Reditech, ke beranda"
        >
          Reditech
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Masuk</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/source-code">Jelajahi katalog</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
