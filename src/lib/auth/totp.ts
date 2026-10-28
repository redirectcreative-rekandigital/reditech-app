import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * TOTP RFC 6238 (SHA-1, 30 detik, 6 digit) untuk MFA admin — FR-AUTH-08.
 *
 * Implementasi sendiri supaya tidak menambah dependensi kripto; rumusnya
 * standar sehingga aplikasi authenticator mana pun bisa memakainya.
 */
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;
const DIGITS = 6;

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const character of clean) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/** Secret 20 byte (160 bit) — ukuran yang disarankan RFC 4226. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function totpCode(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac("sha1", key).update(message).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const binary =
    ((digest[offset]! & 0x7f) << 24) |
    (digest[offset + 1]! << 16) |
    (digest[offset + 2]! << 8) |
    digest[offset + 3]!;

  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

/** Menerima kode pada jendela ±1 langkah (toleransi jam perangkat). */
export function verifyTotp(secret: string, code: string, window = 1): boolean {
  const normalized = code.replace(/\s+/g, "");
  if (!new RegExp(`^\\d{${DIGITS}}$`).test(normalized)) return false;

  const current = Math.floor(Date.now() / 1000 / STEP_SECONDS);
  const supplied = Buffer.from(normalized);

  for (let offset = -window; offset <= window; offset += 1) {
    const expected = Buffer.from(totpCode(secret, current + offset));
    if (supplied.length === expected.length && timingSafeEqual(supplied, expected)) {
      return true;
    }
  }

  return false;
}

export function otpauthUrl(secret: string, account: string, issuer = "Reditech"): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}
