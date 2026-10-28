import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[90] focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
      >
        Lewati ke konten
      </a>
      <SiteHeader />
      <main id="konten" className="pb-16">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
