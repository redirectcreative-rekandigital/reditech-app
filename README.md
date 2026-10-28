# Reditech

Katalog source code siap pakai untuk developer Indonesia. Unduh gratis lewat iklan,
atau beli tanpa iklan dengan riwayat unduhan dan invoice.

Aplikasi ini adalah **build ulang fungsional** dari Papicode.id dengan identitas,
tema, dan perbaikan tersendiri. Paket PRD lengkap ada di `../prd/`.

## Status

**M3 fase 1 — autentikasi admin, MFA, dan RBAC.** Beranda, katalog, dan detail item sudah dirender server dari PostgreSQL (M1), alur unduhan gratis lengkap (M2), dan panel admin kini benar-benar tertutup: login kata sandi, MFA TOTP wajib, sesi yang bisa dicabut, serta kapabilitas per rute. Isi panel (CRUD item, taksonomi, media, tutorial, ulasan, pengaturan, audit) masih kerangka `RouteStub` yang sudah dijaga kapabilitas — lihat `../prd/06-milestones.md` §M3.

## Stack

| Lapis | Pilihan |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components) |
| Bahasa | TypeScript strict |
| Gaya | Tailwind CSS v4 + shadcn/ui (45 primitif) |
| Database | PostgreSQL 16 + Prisma |
| Cache/antrean | Redis 7 |
| Auth | Sesi DB sendiri (skema kompatibel Auth.js); Auth.js untuk Google OAuth di M4 |
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
melaporkan `not_configured` (bukan `down`). Redis **opsional**: tanpa Redis, rate
limit burst memakai sliding window di memori proses, sedangkan kuota unduhan
selalu dihitung dari tabel `downloads`.

Untuk mencoba unduhan tanpa kredensial Drive, `.env` lokal memakai:

```dotenv
STORAGE_DRIVER=local
LOCAL_STORAGE_DIR=.storage
DL_GATE_SECRET=local-dev-gate-secret-please-change
```

`DL_GATE_SECRET` wajib saat `npm run start` (mode produksi) karena cookie gerbang
ditandatangani HMAC; di `npm run dev` ada nilai pengembangan. Berkas contoh
`seed/<slug>.zip` dibuat otomatis oleh `npm run db:seed`.

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
| `npm run db:seed` | Seed idempoten: superadmin + akun uji dev, kategori, teknologi, setting, 3 item + 6 media + 3 ZIP contoh, 2 tutorial |
| `npm run db:studio` | Prisma Studio |

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

Berkas unduhan contoh (`pos-kasir-laravel.zip` 612 B, `undangan-digital-nextjs.zip`
610 B, `erp-gudang-laravel.zip` 604 B) dibuat `prisma/seed-storage.ts` tanpa
dependensi ZIP tambahan. `items.driveFileId` menyimpan **kunci penyimpanan**
provider-agnostik (`seed/<slug>.zip` untuk lokal); seed tidak menimpa kunci yang
sudah bukan `seed/…`, jadi unggahan asli aman saat seed diulang.

## Unduhan gratis

Alur `FR-DL-01..09`, tanpa tautan penyimpanan pernah sampai ke browser:

| Langkah | Endpoint | Hasil |
| --- | --- | --- |
| 1 | `GET /api/download/<slug>` | `302` ke `/download/<slug>/ads` (item gratis) |
| 2 | `GET /download/<slug>/ads` | Proxy memasang `dl_gate` (HMAC, 900 s, HttpOnly); halaman `noindex` + `private, no-store` |
| 3 | Hitung mundur | Sisa waktu dihitung server dari `issuedAt` cookie; muat ulang tidak mengulang waktu; tanpa JS cukup muat ulang |
| 4 | `POST /api/download/<slug>/token` | Form → `303` ke berkas; `fetch` → `201` JSON; tanpa gerbang `403 AD_GATE_REQUIRED` |
| 5 | `GET /api/download/file/<token>` | Streaming dari `StorageProvider`; token diklaim atomik sebelum byte pertama |
| 6 | Selesai | `Download(GRANTED)` + `items.downloadCount` naik |

Status dan hasil yang sudah diuji di `next start` + PostgreSQL 16.12
(`STORAGE_DRIVER=local`):

| Uji | Hasil |
| --- | --- |
| Berkas utuh | `200`, 612 B, SHA-256 sama dengan berkas seed, `Content-Disposition: attachment`, `Accept-Ranges: none` |
| Token dipakai ulang | `410` + halaman "Tautan unduhan sudah kedaluwarsa" + tombol "Minta tautan baru" |
| Token tak dikenal | `404` |
| Tanpa cookie gerbang | `403 AD_GATE_REQUIRED` (JSON) / `303 ?error=ad_gate_required` (form) |
| Kuota | 5 `GRANTED`, unduhan ke-6 `429 RATE_LIMITED` + `Retry-After` |
| Item arsip | `410` pada ads/expired/api/token |
| Item premium | `303 /source-code/<slug>?beli=1`; `token` tanpa entitlement `403` |
| Berkas > 50 MB | `warnLargeFile: true` + peringatan "tidak dapat dilanjutkan" |
| `ads.enabled=false` | Tanpa hitung mundur; tombol langsung "Unduh sekarang"; `POST token` tidak menuntut `dl_gate` |
| Riwayat | `downloads` berisi `GRANTED`, `DENIED_RATE_LIMIT`, `DENIED_EXPIRED_TOKEN` |

**Driver penyimpanan.** `STORAGE_DRIVER=local|drive`; kosong berarti Drive bila
kredensial service account lengkap, selain itu lokal. Antarmuka `StorageProvider`
sama (`open(key)` + `supportsRange`), dan `driveFileId` diperlakukan sebagai
kunci penyimpanan, bukan ID khusus Google. `local` menolak path yang keluar dari
akar penyimpanan.

**Deviasi dari spesifikasi (disengaja, lihat `../prd/04-api-spec.md` §3.3):**

- Token **diklaim sebelum stream** agar dua permintaan paralel tidak memakai satu
  token. Konsekuensinya tautan tidak bisa dilanjutkan setelah koneksi putus.
- Path `/api/download/file/*` **dikecualikan** dari pengalihan huruf kecil: token
  base64url peka huruf besar-kecil (tanpa pengecualian, tautan baru langsung
  `404` setelah `308`).
- `dl_session` dibuat **sebelum** token diterbitkan agar unduhan pertama ikut
  dihitung kuota.

## Autentikasi admin

Panel `/admin` ditutup untuk publik. Alurnya:

| Langkah | Rute | Hasil |
| --- | --- | --- |
| 1 | `GET /admin/*` | Tanpa sesi → `307 /login?redirect=<path>` |
| 2 | `POST /login` (Server Action) | Kata sandi benar → cookie `rd_session` (8 jam) lalu `307 /admin/mfa`; bila MFA sudah aktif → cookie tantangan `rd_mfa` (5 menit) lalu `307 /login/mfa` |
| 3 | `/login/mfa` | Kode TOTP **atau** kode pemulihan → sesi penuh + `307 <tujuan>` |
| 4 | `/admin/mfa` | Enrol: QR + kunci manual, lalu 10 kode pemulihan yang hanya tampil sekali; bisa juga menonaktifkan MFA |
| 5 | `POST` logout | Baris `sessions` dihapus, cookie dibersihkan |

Otorisasi ditegakkan tiga lapis: **proxy** (status 307/403 final), **setiap halaman**
(`requireAdmin()` / `requireCapability()`), dan **setiap Server Action**
(`actionActor()`). Layout panel hanya mengatur tampilan dan navigasi — diuji bahwa
`forbidden()` di layout tidak menghentikan render segmen halaman.

| Kondisi | `/admin/*` |
| --- | --- |
| Anonim | `307 /login?redirect=…` |
| Cookie sesi tidak sah/kedaluwarsa | `307 /login`, cookie dihapus |
| `USER` | **403** + halaman `/403` |
| `ADMIN`/`SUPERADMIN` tanpa MFA | `307 /admin/mfa` |
| Admin dengan MFA, kapabilitas kurang | **403** |
| Admin dengan MFA + kapabilitas | `200` |

Akun uji pengembangan dibuat seed hanya bila `NODE_ENV !== "production"`:

| Email | Peran | Kata sandi |
| --- | --- | --- |
| `admin@reditech.id` | SUPERADMIN (semua kapabilitas) | `Reditech#2026` |
| `editor@reditech.id` | ADMIN, bundel Editor (tanpa `user:read`, `setting:*`, `item:publish`) | `Reditech#2026` |
| `pengguna@reditech.id` | USER — `/admin` selalu `403` | `Reditech#2026` |

Kata sandi disimpan sebagai `scrypt$N$r$p$salt$hash` (modul `node:crypto`, tanpa
dependensi native). Di produksi seed **tidak** memasang kata sandi sama sekali
(`SEED_ADMIN_PASSWORD` kosong) karena pemilik masuk lewat Google OAuth/undangan di
M4; mengisi `SEED_ADMIN_PASSWORD` eksplisit akan memasang ulang kata sandi itu pada
setiap seed. Nilai kosong diperlakukan sebagai "tidak diisi".

MFA memakai TOTP (RFC 6238, implementasi sendiri) + `qrcode` untuk QR. Rahasia TOTP
dan kode pemulihan dienkripsi AES-256-GCM dengan `MFA_ENCRYPTION_KEY`; bila kosong,
kunci diturunkan dari `AUTH_SECRET` (cukup untuk lokal). `AUTH_SECRET` **wajib**
diisi di produksi.

Penyimpangan dari rencana (detail di `../prd/06-milestones.md` §M3): sesi dikelola
sendiri karena Auth.js Credentials tidak mendukung database session, sedangkan FR
mewajibkan sesi yang bisa dicabut. Tabel `sessions` tetap kompatibel dengan skema
Auth.js sehingga Google OAuth di M4 bisa memakainya.

## Struktur

```
src/
├── app/
│   ├── (public)/     # katalog, tutorial, sponsor, legal, checkout, invoice, 403/410/offline
│   ├── (auth)/       # login, register — shell minimal
│   ├── (app)/        # dashboard pengguna
│   ├── (admin)/      # panel admin
│   ├── api/health/   # status db, redis, drive
│   ├── api/download/ # masuk, token, meta, stream berkas
│   ├── dev/          # pratinjau komponen, mati di produksi
│   └── layout.tsx    # <html>, font, Toaster, JSON-LD
├── components/
│   ├── ui/           # shadcn — dihasilkan CLI, jangan diedit manual
│   ├── ui-ext/       # Button, Badge, IconButton dengan varian produk
│   ├── layout/       # Container, header, footer, shell dashboard/admin
│   ├── catalog/      # FilterBar, ItemCard, Pagination, ResultCount, skeleton
│   ├── item/         # galeri + lightbox, panel unduhan, tombol bagikan
│   ├── download/     # AdGateCountdown, FileSizeNotice
│   ├── media/        # MediaImage (optimizer dilewati untuk aset lokal)
│   ├── auth/         # formulir masuk, verifikasi MFA, enrol, tombol keluar
│   ├── system/       # ForbiddenView bersama untuk /403 dan forbidden.tsx
│   ├── dev/          # RouteStub untuk kerangka M0, pratinjau komponen
│   └── seo/          # JSON-LD Organization + Product/BreadcrumbList
├── lib/              # util bersama (prisma, catalog, items, format, media, og, site)
│   ├── auth/         # sesi, kata sandi scrypt, TOTP, kapabilitas, aktor
│   ├── admin/        # audit log, revisi, nav berfilter kapabilitas, peta rute
│   ├── downloads/    # gate, token, kuota, akses item
│   ├── storage/      # StorageProvider: local + Google Drive
│   └── http/         # amplop error API, replay halaman status
└── proxy.ts          # CSP, HSTS, apex → www, kanonik katalog, status 404/410/403, gerbang admin

prisma/
├── schema.prisma     # transkripsi prd/03-data-model.md
├── migrations/       # init + invariants (CHECK, partial unique, GIN)
├── seed-storage.ts   # ZIP contoh tanpa dependensi
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
| `/download/<arsip>/{ads,expired}` | `410` + isi halaman `/410` |
| `/download/<tidak ada>/ads` | `404` + isi halaman `/404` |
| `/download/<premium>/ads` | `303` ke `/source-code/<slug>?beli=1` |
| `GET /download/<gratis>/ads` | `200` + `Set-Cookie: dl_gate` |
| `/api/download/file/AbC…` | **tidak** dialihkan ke huruf kecil (token peka huruf besar-kecil) |
| `GET /admin/*` tanpa sesi | `307 /login?redirect=<path>` |
| `GET /admin/*` dengan sesi tidak sah | `307 /login` + hapus `rd_session` |
| `GET /admin/*` oleh `USER` | `403` + isi halaman `/403` |
| `GET /admin/*` tanpa MFA (selain `/admin/mfa`) | `307 /admin/mfa` |
| `GET /login/mfa` tanpa cookie `rd_mfa` | `307 /login` |

`permanentRedirect()` atau `notFound()` di dalam `<Suspense>` hanya menghasilkan
`200` + pengalihan sisi klien, jadi keduanya tidak dipakai untuk kasus di atas.

Status `410` dan `403` tidak bisa dipasang lewat `rewrite(..., { status })` di
`next start`: halaman `/410` dan `/403` diprerender dan entri cache-nya membalas
`200`. Proxy karena itu mengambil HTML-nya sekali dengan header internal
`x-reditech-status-page: 1`, lalu membalasnya dengan status yang diminta. Rasional
lengkap ada di `../prd/12-route-map.md` §9 dan §12.0.

## Cache

Dengan `cacheComponents: true`, tidak ada `export const revalidate`; umur cache
ditentukan di fungsi data:

| Fungsi | `cacheLife` | Tag |
| --- | --- | --- |
| `getFeaturedItems()` | `minutes` (60 s) | `items` |
| `getItemDetail(slug)` | `minutes` (60 s) | `item:<slug>`, `items` |
| `getCatalogCategories()` | `hours` | `categories` |
| `getSetting(key)` | `hours` (1 jam) | `settings` — admin M3 memanggil `revalidateTag("settings")` |
| `getItemStatus(slug)` | tanpa cache | — (proxy harus melihat arsip seketika) |
| `getItemAccess(slug)` | tanpa cache | — (proxy butuh status + tipe sebelum render) |

Catatan: perubahan `Setting` langsung di database (mis. `ads.enabled`) baru terlihat
setelah cache `settings` kedaluwarsa atau proses di-restart; panel admin M3 akan
memanggil `revalidateTag`.

## Konvensi

- Warna, tipografi, radius, dan spacing **hanya** dari `../prd/design.md` dan
  `../prd/10-design-tokens.md`. Tidak ada hex baru di komponen.
- `cn` berasal dari paket [`cn`](https://github.com/shadcn-ui/cn) (shadcn 2026),
  bukan `clsx` + `tailwind-merge`.
- Halaman yang belum diimplementasikan (tutorial, dashboard, admin, checkout, donasi)
  masih memakai `RouteStub`; komponen itu dihapus bertahap per milestone.

## Yang belum ada

- Logo, wordmark, favicon, ikon PWA 192/512, dan aset OG statis — desain CRUD-nya
  ada di `../prd/09-superadmin-admin.md` (tab Identitas), implementasi di M3.
- Kartu sponsor di beranda (FR-CAT-13) dan slot iklan interstisial masih
  placeholder jujur; data sponsor belum ada sampai M6.
- Isi panel admin M3 fase 2: CRUD item + gate publikasi, taksonomi, pustaka media,
  tutorial, `/admin/ulasan`, pengaturan (termasuk aset brand/landing sebagai baris
  `Media`), audit + ekspor CSV. Halamannya sudah ada dan sudah dijaga kapabilitas,
  tetapi masih `RouteStub`.
- Google OAuth dan seluruh alur akun pembeli (`/dashboard`, profil, riwayat) — M4.
- Integrasi DOKU dan pembayaran; jalur premium berhenti di `?beli=1`.
- Google Drive sebagai driver produksi (kredensial service account belum ada);
  saat ini `STORAGE_DRIVER=local`.
- Unggah media dan pustaka aset.
- Service worker untuk `/offline`.

## Catatan dependensi

- **Prisma dipin `6.19.3`.** Tag `latest` di registri saat ini adalah `8.0.0-rc`, yang
  memindahkan generator ke `prisma-client` dan mewajibkan driver adapter. Upgrade
  dilakukan sebagai pekerjaan tersendiri, bukan otomatis.
- `npm audit --omit=dev` melaporkan `deepmerge-ts` (lewat `@prisma/config`) dan
  `valibot`. Keduanya hanya dieksekusi saat Prisma CLI membaca konfigurasi dan tidak
  ada di jalur request; tetap ditinjau pada setiap pembaruan dependensi.

## Lisensi

Hak cipta dilindungi. Kode ini bukan proyek sumber terbuka.
