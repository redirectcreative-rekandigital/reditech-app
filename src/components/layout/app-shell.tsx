import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui-ext/badge";

type NavItem = { href: string; label: string };
type NavGroup = { title: string; items: NavItem[] };

type AppShellProps = {
  /** Label area di header, mis. `Dashboard` atau `Admin`. */
  area: string;
  nav: NavGroup[];
  /** Catatan status guard selama M0. */
  guardNote: string;
  children: React.ReactNode;
};

/**
 * Shell sementara untuk `(app)` dan `(admin)`.
 * Diganti `AppSidebar` berbasis primitif `sidebar` pada M3/M4.
 */
export function AppShell({ area, nav, guardNote, children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-card">
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[90] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus-visible:focus-ring"
      >
        Lewati ke konten
      </a>

      <header className="border-b border-border bg-background">
        <Container size="wide" className="flex h-16 items-center gap-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Reditech
          </Link>
          <span aria-hidden="true" className="text-muted-foreground">
            /
          </span>
          <span className="text-sm font-medium">{area}</span>
          <Badge tone="warning" className="ml-auto">
            Guard menyusul {guardNote}
          </Badge>
        </Container>
      </header>

      <Container size="wide" className="flex flex-col gap-8 py-8 lg:flex-row">
        <nav aria-label={`Navigasi ${area}`} className="lg:w-56 lg:shrink-0">
          <div className="space-y-6">
            {nav.map((group) => (
              <div key={group.title}>
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {group.title}
                </p>
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block rounded-md px-3 py-2 text-sm hover:bg-muted focus-visible:focus-ring"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <main id="konten" className="min-w-0 flex-1">
          {children}
        </main>
      </Container>
    </div>
  );
}
