import { cache } from "react";
import { forbidden, redirect } from "next/navigation";
import { headers } from "next/headers";

import { can, isAdminRole, type Capability } from "./permissions";
import { readSession } from "./sessions";

/**
 * Data Access Layer panel (`09-superadmin-admin.md` §8): setiap halaman dan
 * setiap Server Action memeriksa aktor di sini, bukan mengandalkan proxy.
 */
export type Actor = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "SUPERADMIN";
  permissions: string[];
  mfaEnabled: boolean;
  sessionId: string;
};

/**
 * `cache` mendeduplikasi pembacaan sesi dalam satu render pass; Server Action
 * dan Route Handler tidak berada dalam render pass sehingga selalu membaca
 * ulang (perilaku yang diinginkan untuk otorisasi).
 */
export const getActor = cache(async (): Promise<Actor | null> => {
  const session = await readSession();
  if (!session) return null;

  const { user } = session;
  if (!isAdminRole(user.role)) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "ADMIN" | "SUPERADMIN",
    permissions: user.permissions,
    mfaEnabled: user.mfaEnabled,
    sessionId: session.sessionId,
  };
});

/** Untuk halaman yang membutuhkan aktor apa pun (M4: dashboard pengguna). */
export async function requireSessionUser() {
  const session = await readSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * ADMIN/SUPERADMIN tanpa syarat MFA — hanya dipakai halaman enrol MFA dan
 * pengaturan keamanan akun sendiri.
 */
export async function requireAdminRole(): Promise<Actor> {
  const session = await readSession();
  if (!session) redirect("/login");

  if (!isAdminRole(session.user.role)) forbidden();

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as "ADMIN" | "SUPERADMIN",
    permissions: session.user.permissions,
    mfaEnabled: session.user.mfaEnabled,
    sessionId: session.sessionId,
  };
}

/**
 * Guard utama panel: peran admin + MFA aktif. Akun admin tanpa TOTP hanya bisa
 * mencapai halaman enrol (AC-ADM-11).
 */
export async function requireAdmin(): Promise<Actor> {
  const actor = await requireAdminRole();
  if (!actor.mfaEnabled) redirect("/admin/mfa");
  return actor;
}

export async function requireCapability(capability: Capability): Promise<Actor> {
  const actor = await requireAdmin();
  if (!can(actor, capability)) forbidden();
  return actor;
}

/** Versi untuk Server Action: mengembalikan aktor atau `null` (tanpa throw). */
export async function actionActor(capability?: Capability): Promise<Actor | null> {
  const actor = await getActor();
  if (!actor || !actor.mfaEnabled) return null;
  if (capability && !can(actor, capability)) return null;
  return actor;
}

export type RequestMeta = {
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
};

/** Metadata untuk `AdminAuditLog` — IP tidak pernah disimpan mentah penuh. */
export async function requestMeta(): Promise<RequestMeta> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || store.get("x-real-ip") || null;

  return {
    ip: ip ? ip.slice(0, 60) : null,
    userAgent: store.get("user-agent")?.slice(0, 300) ?? null,
    requestId: store.get("x-request-id"),
  };
}
