"use client";

import { Check } from "lucide-react";
import { useId } from "react";

import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/(admin)/admin/kategori/actions";
import {
  createTechnologyAction,
  deleteTechnologyAction,
  updateTechnologyAction,
} from "@/app/(admin)/admin/teknologi/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui-ext/badge";

import { ActionForm } from "./action-form";
import { DeleteRowButton } from "./delete-row-button";
import { EmptyState } from "./empty-state";

export type TaxonomyRow = {
  id: string;
  name: string;
  slug: string;
  order?: number;
  isActive?: boolean;
  /** Teks siap baca, mis. "3 item" atau "2 item · 1 tutorial". */
  usage: string;
  /** Alasan tombol hapus dimatikan; `null` bila boleh dihapus. */
  blockedReason: string | null;
};

const COPY = {
  category: {
    noun: "kategori",
    label: "Kategori",
    createColumns:
      "sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_4.5rem_5.5rem_auto]",
    rowColumns:
      "sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_4.5rem_5.5rem_minmax(0,7rem)_auto]",
    empty: "Belum ada kategori. Tambahkan yang pertama di atas.",
    note: "Kategori aktif tampil sebagai chip filter di katalog. Kategori yang masih dipakai item tidak bisa dihapus — nonaktifkan saja.",
  },
  technology: {
    noun: "teknologi",
    label: "Teknologi",
    createColumns: "sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]",
    rowColumns: "sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,7rem)_auto]",
    empty: "Belum ada teknologi. Tambahkan yang pertama di atas.",
    note: "Teknologi dipakai filter katalog dan tag tutorial. Yang masih dipakai tidak bisa dihapus.",
  },
} as const;

const FIELD_LABELS = { name: "Nama", slug: "Slug", order: "Urutan" };

/**
 * Kelola kategori/teknologi: satu form tambah, lalu satu form per baris untuk
 * sunting (nama, slug, urutan, status) dan tombol hapus dengan konfirmasi.
 *
 * Dua entitas berbagi komponen ini karena kontraknya identik; hanya empat
 * Server Action dan kolom tambahan kategori (urutan, aktif) yang berbeda.
 */
export function TaxonomyManager({
  kind,
  rows,
  canWrite,
  canDelete,
}: {
  kind: "category" | "technology";
  rows: TaxonomyRow[];
  canWrite: boolean;
  canDelete: boolean;
}) {
  const copy = COPY[kind];
  const id = useId();

  const actions =
    kind === "category"
      ? {
          create: createCategoryAction,
          update: updateCategoryAction,
          remove: deleteCategoryAction,
        }
      : {
          create: createTechnologyAction,
          update: updateTechnologyAction,
          remove: deleteTechnologyAction,
        };

  return (
    <div className="flex flex-col gap-6">
      {canWrite ? (
        <section aria-labelledby={`${id}-tambah`} className="rounded-lg border border-border bg-background">
          <div className="border-b border-border px-4 py-3">
            <h2 id={`${id}-tambah`} className="text-sm font-semibold">
              Tambah {copy.noun}
            </h2>
            <p className="text-sm text-muted-foreground">
              Biarkan slug kosong untuk membuatnya otomatis dari nama.
            </p>
          </div>

          <ActionForm
            action={actions.create}
            submitLabel="Tambah"
            successMessage={`${copy.label} ditambahkan.`}
            resetOnSuccess
            fieldLabels={FIELD_LABELS}
            className={`grid p-4 sm:items-end ${copy.createColumns}`}
          >
            <div className="grid gap-1.5">
              <Label htmlFor={`${id}-name`}>Nama</Label>
              <Input
                id={`${id}-name`}
                name="name"
                required
                minLength={2}
                maxLength={60}
                autoComplete="off"
                placeholder={kind === "category" ? "Mis. Aplikasi web" : "Mis. Next.js"}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`${id}-slug`}>Slug</Label>
              <Input
                id={`${id}-slug`}
                name="slug"
                maxLength={80}
                autoComplete="off"
                spellCheck={false}
                placeholder="otomatis-dari-nama"
                className="font-mono"
              />
            </div>
            {kind === "category" ? (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor={`${id}-order`}>Urutan</Label>
                  <Input
                    id={`${id}-order`}
                    name="order"
                    type="number"
                    min={0}
                    max={999}
                    step={1}
                    defaultValue={0}
                  />
                </div>
                <label className="flex h-9 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked
                    className="size-4 accent-primary"
                  />
                  Aktif
                </label>
              </>
            ) : null}
          </ActionForm>
        </section>
      ) : (
        <Alert>
          <AlertDescription>
            Kamu hanya punya akses baca (<code className="font-mono">taxonomy:read</code>), jadi
            daftar di bawah tampil tanpa form sunting.
          </AlertDescription>
        </Alert>
      )}

      <section aria-labelledby={`${id}-daftar`} className="rounded-lg border border-border bg-background">
        <div className="border-b border-border px-4 py-3">
          <h2 id={`${id}-daftar`} className="text-sm font-semibold">
            Daftar {copy.noun}
          </h2>
          <p className="max-w-prose text-sm text-muted-foreground">{copy.note}</p>
        </div>

        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState title={`Belum ada ${copy.noun}`} description={copy.empty} />
          </div>
        ) : (
          <ul>
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-2 border-b border-border px-4 py-3 last:border-b-0 lg:flex-row lg:items-center"
              >
                {canWrite ? (
                  <ActionForm
                    action={actions.update}
                    submitLabel="Simpan"
                    pendingLabel="Menyimpan…"
                    successMessage="Perubahan tersimpan."
                    fieldLabels={FIELD_LABELS}
                    className={`grid flex-1 sm:items-center ${copy.rowColumns}`}
                  >
                    <input type="hidden" name="id" value={row.id} />

                    <div className="grid gap-1 sm:contents">
                      <Label htmlFor={`${row.id}-name`} className="sm:sr-only">
                        Nama
                      </Label>
                      <Input
                        id={`${row.id}-name`}
                        name="name"
                        defaultValue={row.name}
                        required
                        minLength={2}
                        maxLength={60}
                        autoComplete="off"
                      />
                    </div>

                    <div className="grid gap-1 sm:contents">
                      <Label htmlFor={`${row.id}-slug`} className="sm:sr-only">
                        Slug
                      </Label>
                      <Input
                        id={`${row.id}-slug`}
                        name="slug"
                        defaultValue={row.slug}
                        maxLength={80}
                        autoComplete="off"
                        spellCheck={false}
                        className="font-mono"
                      />
                    </div>

                    {kind === "category" ? (
                      <>
                        <div className="grid gap-1 sm:contents">
                          <Label htmlFor={`${row.id}-order`} className="sm:sr-only">
                            Urutan
                          </Label>
                          <Input
                            id={`${row.id}-order`}
                            name="order"
                            type="number"
                            min={0}
                            max={999}
                            step={1}
                            defaultValue={row.order ?? 0}
                            className="tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="flex h-9 items-center gap-1.5 text-sm">
                            <input
                              type="checkbox"
                              name="isActive"
                              defaultChecked={row.isActive}
                              className="size-4 accent-primary"
                            />
                            <span className="sm:sr-only">Aktif</span>
                          </label>
                        </div>
                      </>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {kind === "category" ? (
                        row.isActive ? (
                          <Badge tone="success">
                            <Check aria-hidden="true" />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge tone="neutral">Nonaktif</Badge>
                        )
                      ) : null}
                      <span>{row.usage}</span>
                    </div>
                  </ActionForm>
                ) : (
                  <div className="flex flex-1 flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{row.name}</span>
                    <span className="font-mono text-muted-foreground">{row.slug}</span>
                    <span className="text-muted-foreground">{row.usage}</span>
                  </div>
                )}

                <DeleteRowButton
                  action={actions.remove}
                  id={row.id}
                  entityLabel={copy.label}
                  itemName={row.name}
                  blockedReason={
                    canDelete ? row.blockedReason : "Kapabilitas taxonomy:delete diperlukan."
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
