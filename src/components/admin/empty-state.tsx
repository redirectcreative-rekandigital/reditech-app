import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Keadaan kosong (`09 §9`): judul singkat, satu kalimat, satu aksi utama.
 * Bukan ilustrasi besar — panel dipakai berulang, bukan halaman pemasaran.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong bg-card px-6 py-12 text-center">
      {Icon ? <Icon className="size-6 text-muted-foreground" aria-hidden="true" /> : null}
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium">{title}</p>
        <p className="mx-auto max-w-prose text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
