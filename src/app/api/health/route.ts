import { NextResponse, connection } from "next/server";

import { prisma } from "@/lib/prisma";
import { pingRedis } from "@/lib/redis";

/**
 * `GET /api/health` — `04-api-spec.md` §8.
 * Tanpa detail internal: hanya status per dependensi. `503` dipakai bila
 * dependensi yang wajib (PostgreSQL) atau Redis yang dikonfigurasi gagal.
 */
export async function GET() {
  // Health check tidak boleh ikut diprerender saat build.
  await connection();

  let db = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "down";
  }

  const redis = process.env.REDIS_URL
    ? (await pingRedis())
      ? "ok"
      : "down"
    : "not_configured";

  const drive =
    process.env.GOOGLE_DRIVE_SA_JSON && process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
      ? "ok"
      : "not_configured";

  const healthy = db === "ok" && redis !== "down";

  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", db, redis, drive },
    {
      status: healthy ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}
