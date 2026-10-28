import { createSign } from "node:crypto";

import { StorageError, type StorageProvider, type StoredFile } from "./types";

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

function readServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_DRIVE_SA_JSON?.trim();
  if (!raw) return null;

  const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");

  try {
    const parsed = JSON.parse(json) as Partial<ServiceAccount>;
    if (!parsed.client_email || !parsed.private_key) return null;
    return { client_email: parsed.client_email, private_key: parsed.private_key };
  } catch {
    return null;
  }
}

export function driveConfigured(): boolean {
  return readServiceAccount() !== null;
}

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

/**
 * Token OAuth service account dibuat sendiri (JWT RS256) supaya tidak perlu
 * `googleapis` — satu dependensi besar hanya untuk satu endpoint.
 */
async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - 60_000 > Date.now()) return cachedToken.value;

  const account = readServiceAccount();
  if (!account) throw new StorageError("GOOGLE_DRIVE_SA_JSON belum diisi");

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );

  let signature: string;
  try {
    signature = createSign("RSA-SHA256")
      .update(`${header}.${claims}`)
      .sign(account.private_key, "base64url");
  } catch (error) {
    throw new StorageError("Private key service account tidak sah", error);
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new StorageError(`OAuth Drive gagal: ${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new StorageError("OAuth Drive tidak mengembalikan token");

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };

  return cachedToken.value;
}

async function openWithToken(key: string, token: string): Promise<Response> {
  return fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(key)}?alt=media&supportsAllDrives=true`,
    { headers: { authorization: `Bearer ${token}` }, cache: "no-store" },
  );
}

/**
 * Provider produksi: `files.get?alt=media`. Drive tidak mendukung `Range` di
 * jalur ini, jadi berkas selalu dikirim utuh (`Accept-Ranges: none`).
 */
export function createDriveProvider(): StorageProvider {
  return {
    name: "google-drive",
    supportsRange: false,

    async open(key: string): Promise<StoredFile> {
      let response = await openWithToken(key, await accessToken());

      if (response.status === 401) {
        // Token bisa dicabut lebih awal; buang cache lalu coba sekali lagi.
        cachedToken = null;
        response = await openWithToken(key, await accessToken());
      }

      if (!response.ok || !response.body) {
        throw new StorageError(`Drive menolak berkas ${key}: ${response.status}`);
      }

      const length = Number(response.headers.get("content-length"));

      return {
        body: response.body as ReadableStream<Uint8Array>,
        sizeBytes: Number.isFinite(length) && length > 0 ? length : null,
        contentType: response.headers.get("content-type") ?? "application/octet-stream",
      };
    },
  };
}
