"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAudit } from "@/lib/admin/audit";
import { getActor, requireAdminRole } from "@/lib/auth/actor";
import {
  MFA_CHALLENGE_COOKIE,
  beginEnrollment,
  confirmEnrollment,
  createMfaChallenge,
  readMfaChallenge,
  verifySecondFactor,
} from "@/lib/auth/mfa";
import { verifyPassword } from "@/lib/auth/password";
import { isAdminRole } from "@/lib/auth/permissions";
import { safeRedirect } from "@/lib/auth/redirect";
import {
  ADMIN_SESSION_SECONDS,
  createSession,
  destroyCurrentSession,
} from "@/lib/auth/sessions";
import { clientIp } from "@/lib/downloads/gate";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  recoveryCodes?: string[];
};

const credentialsSchema = z.object({
  email: z.email({ error: "Alamat email tidak sah." }).trim().toLowerCase(),
  password: z.string().min(1, { error: "Kata sandi wajib diisi." }),
  redirectTo: z.string().optional(),
});

const mfaSchema = z.object({
  code: z.string().trim().min(6, { error: "Masukkan 6 digit kode atau kode pemulihan." }),
  redirectTo: z.string().optional(),
});

async function requestContext() {
  const store = await headers();
  const ip = clientIp(store);
  return {
    ip,
    userAgent: store.get("user-agent"),
    key: `login:${ip ?? "unknown"}`,
  };
}

/**
 * Langkah 1: email + kata sandi. Sesi baru dibuat **hanya** bila akun tidak
 * memakai MFA; bila MFA aktif, yang diterbitkan adalah tantangan 5 menit.
 */
export async function loginAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo") ?? undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const context = await requestContext();
  const limit = await rateLimit({ key: context.key, limit: 10, windowSeconds: 60 });
  if (!limit.ok) {
    return { error: "Terlalu banyak percobaan masuk. Coba lagi dalam satu menit." };
  }

  const { email, password, redirectTo } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      status: true,
      mfaEnabled: true,
    },
  });

  // Pesan seragam: jangan membocorkan email terdaftar atau tidak.
  const invalid = { error: "Email atau kata sandi salah." } satisfies AuthFormState;

  if (!user || !isAdminRole(user.role)) return invalid;

  if (user.status !== "ACTIVE") {
    return { error: "Akun ini tidak aktif. Hubungi pemilik situs." };
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) return invalid;

  if (user.mfaEnabled) {
    const challenge = createMfaChallenge(user.id);
    const store = await cookies();
    store.set(MFA_CHALLENGE_COOKIE, challenge.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: challenge.expiresAt,
    });

    await recordAudit({
      actor: { id: user.id, email: user.email },
      action: "auth.mfa.challenge",
      entityType: "user",
      entityId: user.id,
    });

    const target = safeRedirect(redirectTo);
    redirect(`/login/mfa?redirect=${encodeURIComponent(target)}`);
  }

  await createSession(user.id, {
    ttlSeconds: ADMIN_SESSION_SECONDS,
    userAgent: context.userAgent,
  });

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await recordAudit({
    actor: { id: user.id, email: user.email },
    action: "auth.login",
    entityType: "user",
    entityId: user.id,
  });

  // Akun tanpa MFA tetap wajib mendaftarkan faktor kedua, jadi tujuan langsung
  // dialihkan ke halaman enrol (proxy juga memaksa demikian).
  redirect("/admin/mfa");
}

/** Langkah 2: kode TOTP atau kode pemulihan. */
export async function verifyMfaAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = mfaSchema.safeParse({
    code: formData.get("code"),
    redirectTo: formData.get("redirectTo") ?? undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const store = await cookies();
  const userId = readMfaChallenge(store.get(MFA_CHALLENGE_COOKIE)?.value);
  if (!userId) {
    return { error: "Sesi verifikasi kedaluwarsa. Masuk ulang dari awal." };
  }

  const context = await requestContext();
  const limit = await rateLimit({
    key: `mfa:${userId}:${context.ip ?? "unknown"}`,
    limit: 5,
    windowSeconds: 60,
  });
  if (!limit.ok) {
    return { error: "Terlalu banyak percobaan kode. Coba lagi dalam satu menit." };
  }

  const result = await verifySecondFactor(userId, parsed.data.code);
  if (!result) {
    return { error: "Kode tidak sah atau sudah kedaluwarsa." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, status: true },
  });

  if (!user || !isAdminRole(user.role) || user.status !== "ACTIVE") {
    return { error: "Akun ini tidak dapat mengakses panel." };
  }

  store.delete(MFA_CHALLENGE_COOKIE);

  await createSession(user.id, {
    ttlSeconds: ADMIN_SESSION_SECONDS,
    userAgent: context.userAgent,
  });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  await recordAudit({
    actor: { id: user.id, email: user.email },
    action: result === "recovery" ? "auth.login.recovery" : "auth.login.mfa",
    entityType: "user",
    entityId: user.id,
  });

  redirect(safeRedirect(parsed.data.redirectTo));
}

/**
 * Enrol MFA tahap 1: buat rahasia baru dan tampilkan QR. Dipakai langsung
 * sebagai `action` form, jadi tidak mengembalikan state.
 */
export async function startEnrollmentAction(): Promise<void> {
  const actor = await requireAdminRole();

  if (actor.mfaEnabled) {
    revalidatePath("/admin/mfa");
    return;
  }

  await beginEnrollment({ id: actor.id, email: actor.email });
  revalidatePath("/admin/mfa");
}

/** Enrol MFA tahap 2: verifikasi kode pertama lalu aktifkan. */
export async function confirmEnrollmentAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const actor = await requireAdminRole();
  const code = String(formData.get("code") ?? "").trim();

  if (!/^\d{6}$/.test(code)) {
    return { error: "Masukkan 6 digit dari aplikasi authenticator." };
  }

  const codes = await confirmEnrollment(actor.id, code);
  if (!codes) return { error: "Kode tidak cocok. Pastikan jam perangkat benar." };

  await recordAudit({
    actor,
    action: "auth.mfa.enable",
    entityType: "user",
    entityId: actor.id,
  });

  // Sengaja **tanpa** `revalidatePath`: kode pemulihan hanya dikembalikan sekali
  // lewat state aksi. Kalau halaman dirender ulang, form enrol ter-unmount
  // (halaman beralih ke "MFA aktif") dan kode itu hilang sebelum sempat dibaca.
  return { recoveryCodes: codes };
}

export async function logoutAction(): Promise<void> {
  // Dicatat sebelum sesi dihapus. `getActor()` (bukan `requireAdminRole()`)
  // supaya pengguna biasa yang memanggil logout tidak memicu 403.
  const actor = await getActor();
  if (actor) {
    await recordAudit({
      actor,
      action: "auth.logout",
      entityType: "user",
      entityId: actor.id,
    });
  }

  await destroyCurrentSession();
  redirect("/");
}
