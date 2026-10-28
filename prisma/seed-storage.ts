import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";

/**
 * Berkas contoh untuk pengembangan: ZIP tanpa kompresi (stored) dirakit sendiri
 * supaya seed tidak menambah dependensi arsip. Di produksi berkas berasal dari
 * Google Drive; yang disimpan di database hanya key.
 */
const STORAGE_ROOT = resolve(process.env.LOCAL_STORAGE_DIR ?? ".storage");

type Entry = { name: string; data: Buffer };

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const DOS_TIME = 0;
// 2026-10-28 00:00:00 dalam format MS-DOS
const DOS_DATE = ((2026 - 1980) << 9) | (10 << 5) | 28;

function localHeader(entry: Entry, crc: number): Buffer {
  const name = Buffer.from(entry.name, "utf8");
  const header = Buffer.alloc(30);

  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(DOS_TIME, 10);
  header.writeUInt16LE(DOS_DATE, 12);
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(entry.data.length, 18);
  header.writeUInt32LE(entry.data.length, 22);
  header.writeUInt16LE(name.length, 26);
  header.writeUInt16LE(0, 28);

  return Buffer.concat([header, name]);
}

function centralHeader(entry: Entry, crc: number, offset: number): Buffer {
  const name = Buffer.from(entry.name, "utf8");
  const header = Buffer.alloc(46);

  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(DOS_TIME, 12);
  header.writeUInt16LE(DOS_DATE, 14);
  header.writeUInt32LE(crc, 16);
  header.writeUInt32LE(entry.data.length, 20);
  header.writeUInt32LE(entry.data.length, 24);
  header.writeUInt16LE(name.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(offset, 42);

  return Buffer.concat([header, name]);
}

function buildZip(entries: Entry[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const crc = crc32(entry.data);
    const local = localHeader(entry, crc);
    locals.push(local, entry.data);
    centrals.push(centralHeader(entry, crc, offset));
    offset += local.length + entry.data.length;
  }

  const centralDirectory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);

  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, centralDirectory, end]);
}

function storagePath(key: string): string {
  if (!key || key.startsWith("/") || key.includes("\\") || key.split("/").includes("..")) {
    throw new Error(`Key penyimpanan tidak sah: ${key}`);
  }

  const target = resolve(STORAGE_ROOT, key);
  if (target !== STORAGE_ROOT && !target.startsWith(STORAGE_ROOT + sep)) {
    throw new Error(`Key penyimpanan keluar dari direktori: ${key}`);
  }

  return target;
}

/**
 * Menulis arsip demo (idempoten) dan mengembalikan key + ukuran sebenarnya.
 * `bytes` dipakai `Item.driveFileSize`, sehingga peringatan berkas besar
 * (FR-DL-09) bisa diuji tanpa berkas sungguhan.
 */
export function ensureDemoArchive(slug: string, title: string): { key: string; bytes: number } {
  const key = `seed/${slug}.zip`;
  const path = storagePath(key);

  const readme = [
    `${title} — berkas contoh Reditech`,
    "",
    "Arsip ini dibuat oleh `prisma/seed.ts` untuk menguji alur unduhan.",
    "Di produksi, kolom `items.driveFileId` berisi ID berkas Google Drive",
    "dan berkas dialirkan lewat /api/download/file/[token] — URL Drive tidak",
    "pernah dikirim ke browser.",
    "",
    `Dibuat: ${new Date().toISOString()}`,
    "",
  ].join("\n");

  const entries: Entry[] = [
    { name: "README.txt", data: Buffer.from(readme, "utf8") },
    {
      name: "LICENSE.txt",
      data: Buffer.from(
        "Contoh lisensi untuk data seed. Ganti dengan lisensi item sebenarnya.\n",
        "utf8",
      ),
    },
  ];

  mkdirSync(dirname(path), { recursive: true });

  const archive = buildZip(entries);
  writeFileSync(path, archive);

  return { key, bytes: statSync(path).size };
}
