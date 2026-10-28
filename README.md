# Reditech

Katalog source code siap pakai untuk developer Indonesia. Unduh gratis lewat iklan,
atau beli tanpa iklan dengan riwayat unduhan dan invoice.

Aplikasi ini adalah **build ulang fungsional** dari Papicode.id dengan identitas,
tema, dan perbaikan tersendiri. Paket PRD lengkap ada di `../prd/`.

## Status

**M0 — Fondasi.** Struktur, tema, kerangka rute, skema database, dan health
check selesai. Belum ada data yang tampil di UI, autentikasi, atau pembayaran.
Lihat `../prd/06-milestones.md`.

## Stack

| Lapis | Pilihan |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components) |
| Bahasa | TypeScript strict |
| Gaya | Tailwind CSS v4 + shadcn/ui (45 primitif) |
| Database | PostgreSQL 16 + Prisma |
| Cache/antrean | Redis 7 |
| Auth | Auth.js |
| Pembayaran | DOKU |
| Berkas | Google Drive (proxy server) + Cloudflare R2 (gambar) |
| Deploy | Docker Compose + Caddy (blue-green) di belakang Cloudflare |

## Menjalankan

```bash
cp .env.example .env      # isi kredensial yang tersedia
npm ci
npm run db:deploy         # atau db:migrate saat mengembangkan skema
npm run db:seed
npm run dev               # http://localhost:3000
```

Dengan Docker (butuh Docker Desktop):

```bash
docker compose -f docker-compose.dev.yml up --build
docker compose -f docker-compose.dev.yml exec app npm run db:deploy
docker compose -f docker-compose.dev.yml exec app npm run db:seed
```

### Database tanpa Docker

Di mesin ini Docker belum dipasang dan drive C: hampir penuh, jadi PostgreSQL 16
dijalankan **portable dari drive D** (`D:\reditech-tools`, di luar repo):

```powershell
& "D:\reditech-tools\pgsql\bin\pg_ctl.exe" -D "D:\reditech-tools\pgdata" `
    -l "D:\reditech-tools\pg.log" -o "-p 5432" start
& "D:\reditech-tools\pgsql\bin\pg_ctl.exe" -D "D:\reditech-tools\pgdata" stop
```

Basis data `reditech`, pengguna `reditech` — sama dengan `DATABASE_URL` di `.env`.
Redis belum ada di setup ini; `REDIS_URL` dikosongkan agar `/api/health`
melaporkan `not_configured` (bukan `down`). Redis baru dibutuhkan pada M2.

## Skrip

| Skrip | Isi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | `prisma generate` lalu build produksi |
| `npm run start` | Jalankan hasil build |
| `npm run lint` | ESLint (`next/core-web-vitals` + TS) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Regenerasi Prisma Client |
| `npm run db:migrate` | Migrasi baru saat pengembangan |
| `npm run db:deploy` | Terapkan migrasi yang ada (CI/produksi) |
| `npm run db:seed` | Seed idempoten: superadmin, kategori, teknologi, setting, 3 item, 2 tutorial |
| `npm run db:studio` | Prisma Studio |

## Struktur

```
src/
├── app/
│   ├── (public)/     # katalog, tutorial, sponsor, legal, checkout, invoice, 403/410/offline
│   ├── (auth)/       # login, register — shell minimal
│   ├── (app)/        # dashboard pengguna
│   ├── (admin)/      # panel admin
│   ├── api/health/   # status db, redis, drive
│   ├── dev/          # pratinjau komponen, mati di produksi
│   └── layout.tsx    # <html>, font, Toaster, JSON-LD
├── components/
│   ├── ui/           # shadcn — dihasilkan CLI, jangan diedit manual
│   ├── ui-ext/       # Button, Badge, IconButton dengan varian produk
│   ├── layout/       # Container, header, footer, shell dashboard/admin
│   ├── dev/          # RouteStub untuk kerangka M0
│   └── seo/          # JSON-LD
├── lib/              # util bersama (prisma, redis, og, site, ...)
└── proxy.ts          # CSP, HSTS, apex → www, noindex panel

prisma/
├── schema.prisma     # transkripsi prd/03-data-model.md
├── migrations/       # init + invariants (CHECK, partial unique, GIN)
└── seed.ts           # data minimum §5
```

## Konvensi

- Warna, tipografi, radius, dan spacing **hanya** dari `../prd/design.md` dan
  `../prd/10-design-tokens.md`. Tidak ada hex baru di komponen.
- `cn` berasal dari paket [`cn`](https://github.com/shadcn-ui/cn) (shadcn 2026),
  bukan `clsx` + `tailwind-merge`.
- Semua halaman kerangka memakai `RouteStub`; komponen itu dihapus bertahap.

## Yang belum ada

- Logo, wordmark, favicon, ikon PWA 192/512, dan aset OG statis.
- Auth.js, guard kapabilitas, dan halaman `/admin` yang benar-benar tertutup.
- Integrasi DOKU, proxy Drive, dan unggah media.
- Route handler API selain `/api/health`.
- Service worker untuk `/offline`.
- Redis lokal (menyusul M2; rate limit unduhan).

## Catatan dependensi

- **Prisma dipin `6.19.3`.** Tag `latest` di registri saat ini adalah `8.0.0-rc`, yang
  memindahkan generator ke `prisma-client` dan mewajibkan driver adapter. Upgrade
  dilakukan sebagai pekerjaan tersendiri, bukan otomatis.
- `npm audit --omit=dev` melaporkan `deepmerge-ts` (lewat `@prisma/config`) dan
  `valibot`. Keduanya hanya dieksekusi saat Prisma CLI membaca konfigurasi dan tidak
  ada di jalur request; tetap ditinjau pada setiap pembaruan dependensi.

## Lisensi

Hak cipta dilindungi. Kode ini bukan proyek sumber terbuka.
