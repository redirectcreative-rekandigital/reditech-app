import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import QRCode from "qrcode";

import { prisma } from "@/lib/prisma";

import { MFA_CHALLENGE_COOKIE } from "./cookies";
import { decryptSecret, encryptSecret } from "./crypto";
import { generateTotpSecret, otpauthUrl, verifyTotp } from "./totp";

/**
 * MFA admin (`FR-AUTH-08`, AC-ADM-11). Rahasia TOTP dienkripsi AES-GCM; kode
 * pemulihan juga dienkripsi dan dihapus setelah dipakai.
 */
export { MFA_CHALLENGE_COOKIE };
const CHALLENGE_TTL_SECONDS = 5 * 60;

function challengeSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim() ?? process.env.DL_GATE_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") return "reditech-dev-mfa-challenge";
  throw new Error("AUTH_SECRET wajib diisi untuk MFA");
}

function sign(payload: string): string {
  return createHmac("sha256", challengeSecret()).update(payload).digest("base64url");
}

/** Tantangan singkat antara langkah kata sandi dan langkah TOTP. */
export function createMfaChallenge(userId: string): { value: string; expiresAt: Date } {
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_SECONDS * 1000);
  const payload = `v1.${userId}.${expiresAt.getTime()}`;
  return { value: `${payload}.${sign(payload)}`, expiresAt };
}

export function readMfaChallenge(value: string | undefined): string | null {
  if (!value) return null;

  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return null;

  const [, userId, expiresRaw, signature] = parts;
  const payload = `v1.${userId}.${expiresRaw}`;
  const expected = Buffer.from(sign(payload));
  const supplied = Buffer.from(signature!);

  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  if (Number(expiresRaw) <= Date.now()) return null;

  return userId!;
}

function recoveryCode(): string {
  const raw = randomBytes(5).toString("hex").toUpperCase().slice(0, 8);
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

export type Enrollment = {
  secret: string;
  otpauth: string;
  qrDataUrl: string;
};

export async function beginEnrollment(user: { id: string; email: string }): Promise<Enrollment> {
  const secret = generateTotpSecret();
  const otpauth = otpauthUrl(secret, user.email);
  const qrDataUrl = await QRCode.toDataURL(otpauth, { margin: 1, width: 240 });

  await prisma.user.update({
    where: { id: user.id },
    data: { mfaSecretEnc: encryptSecret(secret), mfaEnabled: false },
  });

  return { secret, otpauth, qrDataUrl };
}

/**
 * Mengaktifkan MFA setelah kode pertama diverifikasi. Kode pemulihan
 * dikembalikan **sekali** dan tidak bisa ditampilkan lagi.
 */
export async function confirmEnrollment(userId: string, code: string): Promise<string[] | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaSecretEnc: true },
  });

  const secret = user?.mfaSecretEnc ? decryptSecret(user.mfaSecretEnc) : null;
  if (!secret || !verifyTotp(secret, code)) return null;

  const codes = Array.from({ length: 10 }, () => recoveryCode());

  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: true,
      mfaRecoveryEnc: codes.map((value) => encryptSecret(value)),
    },
  });

  return codes;
}

export async function disableEnrollment(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: false, mfaSecretEnc: null, mfaRecoveryEnc: [] },
  });
}

/** Verifikasi kode TOTP atau kode pemulihan; kode pemulihan langsung hangus. */
export async function verifySecondFactor(
  userId: string,
  code: string,
): Promise<"totp" | "recovery" | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaSecretEnc: true, mfaRecoveryEnc: true },
  });

  if (!user) return null;

  const secret = user.mfaSecretEnc ? decryptSecret(user.mfaSecretEnc) : null;
  if (secret && verifyTotp(secret, code)) return "totp";

  const normalized = code.trim().toUpperCase();
  const remaining: string[] = [];
  let matched = false;

  for (const encrypted of user.mfaRecoveryEnc) {
    const value = decryptSecret(encrypted);
    if (value && value === normalized && !matched) {
      matched = true;
      continue;
    }
    remaining.push(encrypted);
  }

  if (!matched) return null;

  await prisma.user.update({ where: { id: userId }, data: { mfaRecoveryEnc: remaining } });
  return "recovery";
}

export async function hasPendingEnrollment(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaSecretEnc: true, mfaEnabled: true },
  });

  return Boolean(user?.mfaSecretEnc) && !user?.mfaEnabled;
}

/** Rahasia yang sudah dibuat tetapi belum dikonfirmasi (untuk QR di halaman enrol). */
export async function getPendingSecret(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaSecretEnc: true, mfaEnabled: true },
  });

  if (!user?.mfaSecretEnc || user.mfaEnabled) return null;
  return decryptSecret(user.mfaSecretEnc);
}
