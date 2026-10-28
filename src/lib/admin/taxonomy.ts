import { Prisma } from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { recordAudit } from "@/lib/admin/audit";
import { can, type AdminRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { SLUG_PATTERN, slugify } from "@/lib/slug";

/**
 * Taksonomi katalog (`09-superadmin-admin.md` §6.2). Kategori dipakai chip
 * katalog dan wajib pada setiap item; teknologi dipakai tag item + tutorial.
 *
 * Aturan yang dijaga di sini, bukan hanya di UI:
 * - slug unik dan kanonik,
 * - kategori yang masih dipakai item tidak boleh dihapus (nonaktifkan saja),
 * - teknologi yang masih dipakai tidak boleh dihapus,
 * - setiap mutasi menulis satu baris audit dengan diff.
 */

export type TaxonomyState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export type TaxonomyKind = "category" | "technology";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, { error: "Slug minimal 2 karakter." })
  .max(80, { error: "Slug maksimal 80 karakter." })
  .regex(SLUG_PATTERN, { error: "Slug hanya huruf kecil, angka, dan tanda hubung." });

const nameSchema = z
  .string()
  .trim()
  .min(2, { error: "Nama minimal 2 karakter." })
  .max(60, { error: "Nama maksimal 60 karakter." });

const createSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  order: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});

const updateSchema = createSchema.extend({ id: z.string().min(1) });

const deleteSchema = z.object({ id: z.string().min(1) });

const technologyCreateSchema = z.object({ name: nameSchema, slug: slugSchema });
const technologyUpdateSchema = technologyCreateSchema.extend({ id: z.string().min(1) });

type Actor = {
  id: string;
  email: string;
  role: AdminRole;
  permissions: readonly string[];
};

function readForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const explicitSlug = String(formData.get("slug") ?? "").trim();

  return {
    name,
    slug: explicitSlug ? explicitSlug.toLowerCase() : slugify(name),
    order: formData.get("order") ?? "0",
    isActive: formData.get("isActive") === "on",
  };
}

function flatten(error: z.ZodError): TaxonomyState {
  return { fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]> };
}

function duplicateSlug(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    (error.meta.target as string[]).includes("slug")
  );
}

function touchCatalog() {
  revalidatePath("/admin/kategori");
  revalidatePath("/admin/teknologi");
  revalidatePath("/source-code");
  // `updateTag` (bukan `revalidateTag`): perubahan taksonomi harus langsung
  // terlihat di katalog setelah aksi selesai, tanpa menyajikan data lama.
  updateTag("categories");
  updateTag("items");
}

export async function createCategory(
  actor: Actor,
  formData: FormData,
): Promise<TaxonomyState> {
  const parsed = createSchema.safeParse(readForm(formData));
  if (!parsed.success) return flatten(parsed.error);

  try {
    const created = await prisma.category.create({ data: parsed.data });
    await recordAudit({
      actor,
      action: "category.create",
      entityType: "category",
      entityId: created.id,
      after: parsed.data,
    });
  } catch (error) {
    if (duplicateSlug(error)) return { fieldErrors: { slug: ["Slug sudah dipakai."] } };
    throw error;
  }

  touchCatalog();
  return { ok: true, message: "Kategori ditambahkan." };
}

export async function updateCategory(
  actor: Actor,
  formData: FormData,
): Promise<TaxonomyState> {
  const parsed = updateSchema.safeParse({ ...readForm(formData), id: formData.get("id") });
  if (!parsed.success) return flatten(parsed.error);

  const { id, ...data } = parsed.data;
  const before = await prisma.category.findUnique({ where: { id } });
  if (!before) return { error: "Kategori tidak ditemukan." };

  try {
    await prisma.category.update({ where: { id }, data });
  } catch (error) {
    if (duplicateSlug(error)) return { fieldErrors: { slug: ["Slug sudah dipakai."] } };
    throw error;
  }

  const changed =
    before.name !== data.name ||
    before.slug !== data.slug ||
    before.order !== data.order ||
    before.isActive !== data.isActive;

  if (changed) {
    await recordAudit({
      actor,
      action: "category.update",
      entityType: "category",
      entityId: id,
      before: { name: before.name, slug: before.slug, order: before.order, isActive: before.isActive },
      after: data,
    });
  }

  touchCatalog();
  return { ok: true, message: changed ? "Kategori diperbarui." : "Tidak ada perubahan." };
}

export async function deleteCategory(actor: Actor, formData: FormData): Promise<TaxonomyState> {
  if (!can(actor, "taxonomy:delete")) return { error: "Kapabilitas taxonomy:delete diperlukan." };

  const parsed = deleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Permintaan tidak sah." };

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, name: true, slug: true, order: true, isActive: true, _count: { select: { items: true } } },
  });
  if (!category) return { error: "Kategori tidak ditemukan." };

  // FR-ADM / §6.2: kategori yang masih dipakai item hanya boleh dinonaktifkan.
  if (category._count.items > 0) {
    return {
      error: `Kategori "${category.name}" masih dipakai ${category._count.items} item. Nonaktifkan saja, atau pindahkan itemnya lebih dulu.`,
    };
  }

  await prisma.category.delete({ where: { id: category.id } });
  await recordAudit({
    actor,
    action: "category.delete",
    entityType: "category",
    entityId: category.id,
    before: {
      name: category.name,
      slug: category.slug,
      order: category.order,
      isActive: category.isActive,
    },
  });

  touchCatalog();
  return { ok: true, message: "Kategori dihapus." };
}

export async function createTechnology(
  actor: Actor,
  formData: FormData,
): Promise<TaxonomyState> {
  const raw = readForm(formData);
  const parsed = technologyCreateSchema.safeParse({ name: raw.name, slug: raw.slug });
  if (!parsed.success) return flatten(parsed.error);

  try {
    const created = await prisma.technology.create({ data: parsed.data });
    await recordAudit({
      actor,
      action: "technology.create",
      entityType: "technology",
      entityId: created.id,
      after: parsed.data,
    });
  } catch (error) {
    if (duplicateSlug(error)) return { fieldErrors: { slug: ["Slug sudah dipakai."] } };
    throw error;
  }

  touchCatalog();
  return { ok: true, message: "Teknologi ditambahkan." };
}

export async function updateTechnology(
  actor: Actor,
  formData: FormData,
): Promise<TaxonomyState> {
  const raw = readForm(formData);
  const parsed = technologyUpdateSchema.safeParse({
    id: formData.get("id"),
    name: raw.name,
    slug: raw.slug,
  });
  if (!parsed.success) return flatten(parsed.error);

  const { id, ...data } = parsed.data;
  const before = await prisma.technology.findUnique({ where: { id } });
  if (!before) return { error: "Teknologi tidak ditemukan." };

  try {
    await prisma.technology.update({ where: { id }, data });
  } catch (error) {
    if (duplicateSlug(error)) return { fieldErrors: { slug: ["Slug sudah dipakai."] } };
    throw error;
  }

  const changed = before.name !== data.name || before.slug !== data.slug;
  if (changed) {
    await recordAudit({
      actor,
      action: "technology.update",
      entityType: "technology",
      entityId: id,
      before: { name: before.name, slug: before.slug },
      after: data,
    });
  }

  touchCatalog();
  return { ok: true, message: changed ? "Teknologi diperbarui." : "Tidak ada perubahan." };
}

export async function deleteTechnology(
  actor: Actor,
  formData: FormData,
): Promise<TaxonomyState> {
  if (!can(actor, "taxonomy:delete")) return { error: "Kapabilitas taxonomy:delete diperlukan." };

  const parsed = deleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Permintaan tidak sah." };

  const technology = await prisma.technology.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { items: true, tutorials: true } },
    },
  });
  if (!technology) return { error: "Teknologi tidak ditemukan." };

  const used = technology._count.items + technology._count.tutorials;
  if (used > 0) {
    return {
      error: `Teknologi "${technology.name}" dipakai ${technology._count.items} item dan ${technology._count.tutorials} tutorial. Lepaskan dulu sebelum menghapus.`,
    };
  }

  await prisma.technology.delete({ where: { id: technology.id } });
  await recordAudit({
    actor,
    action: "technology.delete",
    entityType: "technology",
    entityId: technology.id,
    before: { name: technology.name, slug: technology.slug },
  });

  touchCatalog();
  return { ok: true, message: "Teknologi dihapus." };
}
