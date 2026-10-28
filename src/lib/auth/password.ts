import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { promisify } from "node:util";

/**
 * Kata sandi akun lokal (admin, akun lama) di-hash dengan scrypt bawaan Node —
 * tanpa dependensi native. Format yang disimpan:
 *
 * `scrypt$N$r$p$salt$hash` (salt dan hash base64url)
 *
 * Parameter ditulis di dalam hash supaya biaya bisa dinaikkan tanpa mematahkan
 * kata sandi lama.
 */
const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const DEFAULT_COST = { N: 16384, r: 8, p: 1 } as const;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N: DEFAULT_COST.N,
    r: DEFAULT_COST.r,
    p: DEFAULT_COST.p,
    maxmem: 64 * 1024 * 1024,
  })) as Buffer;

  return [
    "scrypt",
    DEFAULT_COST.N,
    DEFAULT_COST.r,
    DEFAULT_COST.p,
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;

  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, salt, hash] = parts;
  const cost = { N: Number(n), r: Number(r), p: Number(p) };
  if (!Number.isInteger(cost.N) || !Number.isInteger(cost.r) || !Number.isInteger(cost.p)) {
    return false;
  }

  const expected = Buffer.from(hash!, "base64url");
  if (expected.length !== KEY_LENGTH) return false;

  let derived: Buffer;
  try {
    derived = (await scryptAsync(password.normalize("NFKC"), Buffer.from(salt!, "base64url"), KEY_LENGTH, {
      ...cost,
      maxmem: 64 * 1024 * 1024,
    })) as Buffer;
  } catch {
    return false;
  }

  return timingSafeEqual(derived, expected);
}
