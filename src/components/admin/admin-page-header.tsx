import type { ReactNode } from "react";

/**
 * Kepala halaman panel. Satu pola untuk semua layar admin supaya judul,
 * penjelasan, dan aksi utama selalu di tempat yang sama (`09 §4`).
 */
export function AdminPageHeader({
  title,
  description,
  actions,
  meta,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {meta ? <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">{meta}</div> : null}
    </div>
  );
}
