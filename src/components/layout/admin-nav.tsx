"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AdminNavGroup } from "@/lib/admin/nav";
import { cn } from "cn";

function isActive(pathname: string, href: string, prefix?: boolean): boolean {
  if (pathname === href) return true;
  if (!prefix) return false;
  return pathname.startsWith(`${href}/`);
}

export function AdminNav({ groups }: { groups: AdminNavGroup[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi Admin" className="space-y-6">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {group.title}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href, item.prefix);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm hover:bg-muted focus-visible:focus-ring",
                      active && "bg-muted font-medium text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
