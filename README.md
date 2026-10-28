# Reditech

Katalog source code siap pakai untuk developer Indonesia. Unduh gratis lewat iklan,
atau beli tanpa iklan dengan riwayat unduhan dan invoice.

Aplikasi ini adalah **build ulang fungsional** dari Papicode.id dengan identitas,
tema, dan perbaikan tersendiri. Paket PRD lengkap ada di `../prd/`.

## Status

**M1 — Katalog publik.** Beranda, katalog (filter/pencarian/paginasi), dan halaman
detail item sudah dirender server dari PostgreSQL. Item arsip membalas `410` dan
slug yang tidak ada membalas `404`; keduanya diputuskan di proxy sebelum shell PPR
dikirim. Belum ada autentikasi, unduhan nyata, atau pembayaran — lihat
`../prd/06-milestones.md`.

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
| `npm run db:seed` | Seed idempoten: superadmin, kategori, teknologi, setting, 3 item + 6 media, 2 tutorial |

## Data contoh

Seed membuat 3 item (`pos-kasir-laravel` gratis, `undangan-digital-nextjs` dan
`erp-gudang-laravel` premium) dengan tanggal terbit berbeda supaya urutan
`newest`/`oldest` benar-benar berubah. Setiap item mendapat 2 screenshot dari
`public/seed/*.svg` (1200×760, dibuat khusus untuk demo) dan thumbnail yang
menunjuk screenshot pertama.

Key media yang diawali `/` berarti aset di `public/`; key R2 tidak pernah diawali
garis miring. `mediaUrl()` membedakan keduanya, dan `MediaImage` melewati optimizer
untuk aset lokal (SVG). Bila berkas demo dihapus, katalog tetap berjalan: kartu
menampilkan inisial judul.
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
│   ├── catalog/      # FilterBar, ItemCard, Pagination, ResultCount, skeleton
│   ├── item/         # galeri + lightbox, panel unduhan, tombol bagikan
│   ├── media/        # MediaImage (optimizer dilewati untuk aset lokal)
│   ├── dev/          # RouteStub untuk kerangka M0, pratinjau komponen
│   └── seo/          # JSON-LD Organization + Product/BreadcrumbList
├── lib/              # util bersama (prisma, catalog, items, format, media, og, site)
└── proxy.ts          # CSP, HSTS, apex → www, kanonik katalog, status 404/410

prisma/
├── schema.prisma     # transkripsi prd/03-data-model.md
├── migrations/       # init + invariants (CHECK, partial unique, GIN)
└── seed.ts           # data minimum §5
```

## Proxy dan status HTTP

`src/proxy.ts` bukan hanya pemasang header; ia menentukan status akhir untuk
katalog dan item **sebelum** shell PPR dikirim:

| Permintaan | Hasil |
| --- | --- |
| `reditech.id/*` | `308` ke `www.reditech.id` |
| `/Source-Code` | `308` ke huruf kecil |
| `?page=99`, `?page=abc`, `?page=0`, `?page=2` (di luar rentang) | `308` ke URL kanonik |
| `?type=PREMIUM&sort=newest` | `308` ke `?type=PREMIUM` |
| `?utm_source=…` (parameter tak dikenal) | `200`, kanonikalisasi dilewati |
| `/source-code/<arsip>` | `410` + isi halaman `/410` |
| `/source-code/<tidak ada>` | `404` + isi halaman `/404` |

`permanentRedirect()` atau `notFound()` di dalam `<Suspense>` hanya menghasilkan
`200` + pengalihan sisi klien, jadi keduanya tidak dipakai untuk kasus di atas.

Status `410` tidak bisa dipasang lewat `rewrite('/410', { status: 410 })` di
`next start`: halaman `/410` diprerender dan entri cache-nya membalas `200`.
Proxy karena itu mengambil HTML `/410` sekali dengan header internal
`x-reditech-status-page: 1`, lalu membalasnya dengan status `410`. Rasional
lengkap ada di `../prd/12-route-map.md` §9 dan §12.0.

## Cache

Dengan `cacheComponents: true`, tidak ada `export const revalidate`; umur cache
ditentukan di fungsi data:

| Fungsi | `cacheLife` | Tag |
| --- | --- | --- |
| `getFeaturedItems()` | `minutes` (60 s) | `items` |
| `getItemDetail(slug)` | `minutes` (60 s) | `item:<slug>`, `items` |
| `getCatalogCategories()` | `hours` | `categories` |
| `getItemStatus(slug)` | tanpa cache | — (proxy harus melihat arsip seketika) |

## Konvensi

- Warna, tipografi, radius, dan spacing **hanya** dari `../prd/design.md` dan
  `../prd/10-design-tokens.md`. Tidak ada hex baru di komponen.
- `cn` berasal dari paket [`cn`](https://github.com/shadcn-ui/cn) (shadcn 2026),
  bukan `clsx` + `tailwind-merge`.
- Halaman yang belum diimplementasikan (tutorial, dashboard, admin, checkout, donasi)
  masih memakai `RouteStub`; komponen itu dihapus bertahap per milestone.

## Yang belum ada

- Logo, wordmark, favicon, ikon PWA 192/512, dan aset OG statis.
- Kartu sponsor di beranda (FR-CAT-13) — belum ada datanya sampai M2/M6.
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
