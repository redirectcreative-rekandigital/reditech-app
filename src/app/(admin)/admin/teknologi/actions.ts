"use server";

import { actionActor } from "@/lib/auth/actor";
import {
  createTechnology,
  deleteTechnology,
  updateTechnology,
  type TaxonomyState,
} from "@/lib/admin/taxonomy";

/** Server Action teknologi — pola sama dengan kategori. */

export async function createTechnologyAction(
  _state: TaxonomyState,
  formData: FormData,
): Promise<TaxonomyState> {
  const actor = await actionActor("taxonomy:write");
  if (!actor) return { error: "Kapabilitas taxonomy:write diperlukan." };

  return createTechnology(actor, formData);
}

export async function updateTechnologyAction(
  _state: TaxonomyState,
  formData: FormData,
): Promise<TaxonomyState> {
  const actor = await actionActor("taxonomy:write");
  if (!actor) return { error: "Kapabilitas taxonomy:write diperlukan." };

  return updateTechnology(actor, formData);
}

export async function deleteTechnologyAction(
  _state: TaxonomyState,
  formData: FormData,
): Promise<TaxonomyState> {
  const actor = await actionActor();
  if (!actor) return { error: "Sesi admin dengan MFA diperlukan." };

  return deleteTechnology(actor, formData);
}
