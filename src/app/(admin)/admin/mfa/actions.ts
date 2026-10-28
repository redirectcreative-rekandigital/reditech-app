"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { recordAudit } from "@/lib/admin/audit";
import { requireAdminRole } from "@/lib/auth/actor";
import { disableEnrollment, verifySecondFactor } from "@/lib/auth/mfa";
import { destroyUserSessions } from "@/lib/auth/sessions";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  code: z.string().trim().min(6, { error: "Masukkan 6 digit kode." }),
  confirm: z.literal("NONAKTIFKAN", { error: "Ketik NONAKTIFKAN untuk melanjutkan." }),
});

export type DisableMfaState = { error?: string; fieldErrors?: Record<string, string[]> };

/**
 * Menonaktifkan MFA wajib disertai kode yang sah: tanpa itu, pencuri cookie
 * sesi bisa mematikan faktor kedua tanpa membuktikan apa pun.
 */
export async function disableMfaAction(
  _state: DisableMfaState,
  formData: FormData,
): Promise<DisableMfaState> {
  const actor = await requireAdminRole();

  const parsed = schema.safeParse({
    code: formData.get("code"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const limit = await rateLimit({
    key: `mfa-disable:${actor.id}`,
    limit: 5,
    windowSeconds: 300,
  });
  if (!limit.ok) return { error: "Terlalu banyak percobaan. Coba lagi nanti." };

  const ok = await verifySecondFactor(actor.id, parsed.data.code);
  if (!ok) return { error: "Kode tidak sah." };

  await disableEnrollment(actor.id);
  await prisma.user.update({
    where: { id: actor.id },
    data: { mfaRecoveryEnc: [] },
  });
  await recordAudit({
    actor,
    action: "auth.mfa.disable",
    entityType: "user",
    entityId: actor.id,
  });

  // Faktor kedua berubah → semua sesi lain dicabut, sesi ini tetap hidup
  // agar admin bisa langsung mendaftar ulang.
  await destroyUserSessions(actor.id, actor.sessionId);

  revalidatePath("/admin/mfa");
  return {};
}
