"use server";

import { actionActor } from "@/lib/auth/actor";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type TaxonomyState,
} from "@/lib/admin/taxonomy";

/**
 * Server Action kategori. Otorisasi dicek di sini (`actionActor`), bukan hanya
 * di halaman: aksi bisa dipanggil langsung tanpa melewati render panel.
 */

export async function createCategoryAction(
  _state: TaxonomyState,
  formData: FormData,
): Promise<TaxonomyState> {
  const actor = await actionActor("taxonomy:write");
  if (!actor) return { error: "Kapabilitas taxonomy:write diperlukan." };

  return createCategory(actor, formData);
}

export async function updateCategoryAction(
  _state: TaxonomyState,
  formData: FormData,
): Promise<TaxonomyState> {
  const actor = await actionActor("taxonomy:write");
  if (!actor) return { error: "Kapabilitas taxonomy:write diperlukan." };

  return updateCategory(actor, formData);
}

export async function deleteCategoryAction(
  _state: TaxonomyState,
  formData: FormData,
): Promise<TaxonomyState> {
  const actor = await actionActor();
  if (!actor) return { error: "Sesi admin dengan MFA diperlukan." };

  return deleteCategory(actor, formData);
}
