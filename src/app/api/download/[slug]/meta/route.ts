import { NextResponse, connection, type NextRequest } from "next/server";

import { getDownloadItem } from "@/lib/downloads/access";
import { apiError, requestIdFrom } from "@/lib/http/api";
import { getStorage } from "@/lib/storage";

/** Ambang peringatan berkas besar (FR-DL-09). */
const LARGE_FILE_BYTES = 50 * 1024 * 1024;

/**
 * `GET /api/download/[slug]/meta` — `04-api-spec.md` 3.4.
 * UI memakainya untuk menampilkan ukuran berkas dan peringatan sebelum
 * mengunduh; tidak ada tautan penyimpanan yang ikut dikirim.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  await connection();

  const { slug } = await params;
  const requestId = requestIdFrom(request);
  const item = await getDownloadItem(slug);

  if (!item || item.deleted) {
    return apiError("NOT_FOUND", "Source code tidak ditemukan.", { status: 404, requestId });
  }

  if (item.status === "ARCHIVED") {
    return apiError("GONE", "Source code sudah diarsipkan.", { status: 410, requestId });
  }

  return NextResponse.json(
    {
      data: {
        sizeBytes: item.fileSize,
        resumable: getStorage().supportsRange,
        warnLargeFile: item.fileSize !== null && item.fileSize > LARGE_FILE_BYTES,
      },
    },
    {
      status: 200,
      headers: { "cache-control": "private, no-store", "x-request-id": requestId },
    },
  );
}
