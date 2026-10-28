import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { AdminNav } from "@/components/layout/admin-nav";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui-ext/badge";
import { adminNav } from "@/lib/admin/nav";
import { requireAdminRole } from "@/lib/auth/actor";

export const instant = false;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Shell panel (`09-superadmin-admin.md` §4). Guard di sini menjaga navigasi dan
 * tampilan; setiap halaman dan Server Action tetap memanggil `requireAdmin()` /
 * `requireCapability()` sendiri — layout tidak menghentikan render segmen lain.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const actor = await requireAdminRole();
  const nav = adminNav(actor);

  // AC-ADM-11: akun admin tanpa TOTP hanya boleh mencapai halaman enrol.
  // Proxy meneruskan path asli lewat `x-pathname`; layout tidak melihat URL.
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (!actor.mfaEnabled && pathname !== "/admin/mfa") redirect("/admin/mfa");

  return (
    <div className="min-h-dvh bg-card">
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[90] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus-visible:focus-ring"
      >
        Lewati ke konten
      </a>

      <header className="border-b border-border bg-background">
        <Container size="wide" className="flex min-h-16 flex-wrap items-center gap-x-4 gap-y-2 py-2">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Reditech
          </Link>
          <span aria-hidden="true" className="text-muted-foreground">
            /
          </span>
          <span className="text-sm font-medium">Admin</span>

          <div className="ml-auto flex items-center gap-3">
            <Badge tone={actor.role === "SUPERADMIN" ? "premium" : "neutral"}>
              {actor.role === "SUPERADMIN" ? "Superadmin" : "Admin"}
            </Badge>
            <span className="hidden text-sm text-muted-foreground sm:inline">{actor.email}</span>
            <LogoutButton />
          </div>
        </Container>
      </header>

      <Container size="wide" className="flex flex-col gap-8 py-8 lg:flex-row">
        <div className="lg:w-56 lg:shrink-0">
          <details className="mb-4 lg:hidden">
            <summary className="cursor-pointer rounded-md border border-border-strong px-3 py-2 text-sm font-medium focus-visible:focus-ring">
              Menu admin
            </summary>
            <div className="mt-3">
              <AdminNav groups={nav} />
            </div>
          </details>

          <div className="hidden lg:block">
            <AdminNav groups={nav} />
          </div>
        </div>

        <main id="konten" className="min-w-0 flex-1">
          {children}
        </main>
      </Container>
    </div>
  );
}
