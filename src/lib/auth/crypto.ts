import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Penyimpanan rahasia TOTP (`User.mfaSecretEnc`) memakai AES-256-GCM. Kunci
 * diambil dari `MFA_ENCRYPTION_KEY` (32 byte base64/hex) atau diturunkan dari
 * `AUTH_SECRET`, sehingga dump database saja tidak cukup untuk membajak MFA.
 */
function encryptionKey(): Buffer {
  const explicit = process.env.MFA_ENCRYPTION_KEY?.trim();

  if (explicit) {
    const buffer = Buffer.from(explicit, "base64");
    if (buffer.length === 32) return buffer;
    const hex = Buffer.from(explicit, "hex");
    if (hex.length === 32) return hex;

    throw new Error("MFA_ENCRYPTION_KEY harus 32 byte (base64 atau hex)");
  }

  const fallback = process.env.AUTH_SECRET?.trim() ?? process.env.DL_GATE_SECRET?.trim();
  if (!fallback) {
    if (process.env.NODE_ENV !== "production") {
      return createHash("sha256").update("reditech-dev-mfa-key").digest();
    }
    throw new Error("AUTH_SECRET atau MFA_ENCRYPTION_KEY wajib diisi untuk MFA");
  }

  return createHash("sha256").update(fallback).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return ["v1", iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(
    ".",
  );
}

export function decryptSecret(payload: string): string | null {
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return null;

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(parts[1]!, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(parts[2]!, "base64url"));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(parts[3]!, "base64url")),
      decipher.final(),
    ]);

    return plain.toString("utf8");
  } catch {
    return null;
  }
}
