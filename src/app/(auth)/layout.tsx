import type { Metadata } from "next";
import Link from "next/link";

import { getCopyrightYear } from "@/lib/site";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const year = await getCopyrightYear();

  return (
    <div className="flex min-h-dvh flex-col bg-card">
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[90] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus-visible:focus-ring"
      >
        Lewati ke konten
      </a>

      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 w-full max-w-shell items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Reditech
          </Link>
        </div>
      </header>

      <main id="konten" className="flex flex-1 items-start justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-sm">{children}</div>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto w-full max-w-shell px-4 py-6 text-xs text-muted-foreground sm:px-6 lg:px-8">
          © {year} Reditech
        </div>
      </footer>
    </div>
  );
}
