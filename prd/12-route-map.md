# Route Map

| Field | Isi |
| --- | --- |
| Domain kanonik | `https://www.reditech.id` (apex → `308` ke `www`) |
| Router | Next.js App Router (route groups, nested layouts) |
| Total rute | **71** — 21 publik, 7 dashboard, 22 admin, 21 API/sistem |
| Rujukan | [`04-api-spec.md`](04-api-spec.md), [`05-ux-flows.md`](05-ux-flows.md), [`09-superadmin-admin.md`](09-superadmin-admin.md) |

---

## 1. Prinsip

1. **URL adalah state.** Filter katalog hanya di query string; tidak ada state tersembunyi.
2. **Grup rute menentukan layout dan guard**, bukan nama folder. `(public)`, `(auth)`, `(app)`, `(admin)`.
3. **Guard dua lapis.** Middleware menolak lebih awal; layout/server action memeriksa ulang kapabilitas.
4. **Halaman publik boleh di-cache; halaman berpengguna tidak pernah.** HTML katalog `no-store` (paritas acuan).
5. **Tidak ada rute hiasan.** Setiap rute punya layar di `05-ux-flows.md` dan requirement di `02-requirements.md`.

---

## 2. Struktur pohon

```
app/
├── (public)/
│   ├── layout.tsx                    # Header + Footer publik
│   ├── page.tsx                      # /
│   ├── source-code/
│   │   ├── page.tsx
│   │   └── [slug]/
│   │       ├── page.tsx
│   │       └── opengraph-image.tsx
│   ├── download/[slug]/{ads,expired}/page.tsx
│   ├── tutorial/
│   │   ├── page.tsx
│   │   └── [slug]/{page,opengraph-image}.tsx
│   ├── donasi/{page,selesai/page}.tsx
│   ├── request-aplikasi/page.tsx
│   ├── request/[token]/page.tsx
│   ├── jasa-pembuatan-website/page.tsx
│   ├── kontak/page.tsx
│   ├── kebijakan-privasi/page.tsx
│   ├── syarat-ketentuan/page.tsx
│   ├── checkout/[orderNo]/page.tsx
│   ├── invoice/[token]/page.tsx
│   ├── 403/page.tsx
│   ├── 410/page.tsx
│   ├── offline/page.tsx
│   ├── not-found.tsx
│   └── error.tsx
├── (auth)/
│   ├── layout.tsx                    # shell minimal tanpa sidebar
│   ├── login/page.tsx
│   └── register/page.tsx
├── (app)/
│   ├── layout.tsx                    # guard USER + AppSidebar
│   └── dashboard/
│       ├── page.tsx
│       ├── source-code/page.tsx
│       ├── pembelian/{page,[orderNo]/page}.tsx
│       ├── unduhan/page.tsx
│       └── profile/{page,keamanan/page}.tsx
├── (admin)/
│   ├── layout.tsx                    # guard ADMIN + AppSidebar admin
│   └── admin/
│       ├── page.tsx
│       ├── item/{page,new/page,[id]/page}.tsx
│       ├── kategori/page.tsx
│       ├── teknologi/page.tsx
│       ├── tutorial/{page,new/page,[id]/page}.tsx
│       ├── sponsor/{page,[id]/page}.tsx
│       ├── request/{page,[id]/page}.tsx
│       ├── pesanan/{page,[orderNo]/page}.tsx
│       ├── entitlement/page.tsx
│       ├── pengguna/{page,[id]/page}.tsx
│       ├── media/page.tsx
│       ├── ulasan/page.tsx
│       ├── pengaturan/page.tsx
│       └── audit/page.tsx
├── api/…                             # lihat §6
├── dev/components/page.tsx           # pratinjau komponen (non-produksi)
├── sitemap.ts
├── robots.ts
├── manifest.ts
├── global-error.tsx
└── layout.tsx                        # <html>, font, Toaster
```

---

## 3. Rute publik

Termasuk `/login` dan `/register` (folder `(auth)`, akses publik).

| Rute | Layar | Render | Cache | Metadata | Catatan |
| --- | --- | --- | --- | --- | --- |
| `/` | S01 | ISR | `revalidate 60`, tag `items` | indexable | Hero + item unggulan + kategori |
| `/source-code` | S02 | Dinamis | `no-store` | indexable, canonical tanpa parameter default | Semua filter di query |
| `/source-code/[slug]` | S03 | ISR | `revalidate 60`, tag `item:<slug>` | indexable + OG dinamis | `ARCHIVED` → 410 |
| `/download/[slug]/ads` | S04 | Dinamis (PPR) | `no-store`, `noindex` | **noindex** | Proxy memasang cookie `dl_gate` |
| `/download/[slug]/expired` | S04 | Dinamis (PPR) | `no-store`, `noindex` | **noindex** | Target `410` untuk token kedaluwarsa/terpakai |
| `/tutorial` | S07 | ISR | `revalidate 300`, tag `tutorials` | indexable | — |
| `/tutorial/[slug]` | S08 | ISR | `revalidate 300`, tag `tutorial:<slug>` | indexable + OG dinamis | — |
| `/donasi` | S09 | ISR | `revalidate 60`, tag `sponsors` | indexable | Papan sponsor |
| `/donasi/selesai` | S09 | Dinamis | `no-store` | noindex | Kembali dari DOKU |
| `/request-aplikasi` | S10 | Statis + form | `no-store` | indexable | Honeypot + waktu isi |
| `/request/[token]` | S10 | Dinamis | `no-store` | noindex | Status usulan |
| `/jasa-pembuatan-website` | S11 | Statis | `static` | indexable | CTA WhatsApp |
| `/kontak` | S12 | Statis | `static` | indexable | Tanpa formulir |
| `/kebijakan-privasi` | S13 | Statis | `static` | indexable | MDX dari repo |
| `/syarat-ketentuan` | S14 | Statis | `static` | indexable | MDX dari repo |
| `/login` | S05 | Dinamis | `no-store` | noindex | Jika sudah login → `/dashboard` |
| `/register` | S06 | Dinamis | `no-store` | noindex | Jika sudah login → `/dashboard` |
| `/checkout/[orderNo]` | S21 | Dinamis | `no-store` | noindex | Hanya pemilik order (cookie/token) |
| `/invoice/[token]` | S18 | Dinamis | `no-store` | noindex | Token bertanda tangan, 7 hari |
| `/403` | S29 | Statis | `static` | noindex | Izin kurang |
| `/404` | — | Statis | `static` | noindex | Sasaran rewrite proxy untuk item draf/tidak ada |
| `/410` | — | Statis | `static` | noindex | Item diarsipkan (direplay proxy dengan status 410) |
| `/offline` | — | Statis | `static` | noindex | Halaman cadangan |

**Aturan canonical katalog:** buang parameter bernilai default (`page=1`, `sort=newest`, `type=ALL`, `search=`, `kategori=`), urutkan sisa kunci secara alfabetis: `kategori, page, search, sort, type`.

---

## 4. Rute dashboard (`(app)`)

Semua `no-store`, `noindex`, guard `USER`.

| Rute | Layar | Isi | Guard tambahan |
| --- | --- | --- | --- |
| `/dashboard` | S15 | Sapaan, 3 kartu statistik, pembelian terakhir | — |
| `/dashboard/source-code` | S16 | Item dengan entitlement aktif | — |
| `/dashboard/pembelian` | S17 | Hanya order `PAID`/`FULFILLED`/`REFUNDED` | — |
| `/dashboard/pembelian/[orderNo]` | S18 | Invoice + status + unduh ulang | Order milik pengguna, selain itu 404 |
| `/dashboard/unduhan` | S19 | 50 unduhan terakhir | — |
| `/dashboard/profile` | S20 | Nama, email disabled, password kondisional | — |
| `/dashboard/profile/keamanan` | S20 | MFA enrol/disable, sesi aktif | — |

---

## 5. Rute admin (`(admin)`)

Semua `no-store`, `noindex`, `X-Robots-Tag: noindex`, guard minimal `ADMIN` + kapabilitas per halaman.

| Rute | Layar | Kapabilitas | Isi |
| --- | --- | --- | --- |
| `/admin` | S22 | — (semua admin ber-MFA) | Ringkasan operasional, antrean, alert |
| `/admin/mfa` | — | — (semua admin) | Enrol TOTP + kode pemulihan, nonaktifkan MFA |
| `/admin/item` | S23 | `item:read` | Daftar + filter + aksi massal |
| `/admin/item/new` | S23 | `item:write` | Editor tab Dasar/Konten/Harga/Berkas/Galeri/SEO |
| `/admin/item/[id]` | S23 | `item:read` (tulis: `item:write`) | Detail + riwayat revisi |
| `/admin/kategori` | — | `taxonomy:read` | CRUD inline |
| `/admin/teknologi` | — | `taxonomy:read` | CRUD inline |
| `/admin/tutorial` | — | `tutorial:read` | Daftar artikel |
| `/admin/tutorial/new` | — | `tutorial:write` | Editor MDX + pratinjau |
| `/admin/tutorial/[id]` | — | `tutorial:read` | Edit + riwayat |
| `/admin/sponsor` | — | `sponsor:read` | Daftar + antrean moderasi |
| `/admin/sponsor/[id]` | — | `sponsor:read` | Detail + setujui/tolak |
| `/admin/request` | — | `request:read` | Pipeline usulan |
| `/admin/request/[id]` | — | `request:read` | Detail + ubah status + catatan |
| `/admin/pesanan` | S25 | `order:read` | Daftar order + filter status |
| `/admin/pesanan/[orderNo]` | S25 | `order:read` | Timeline, refund (`order:refund`) |
| `/admin/entitlement` | — | `entitlement:grant` \| `entitlement:revoke` | Cari per email/slug/order, grant/revoke |
| `/admin/pengguna` | S26 | `user:read` | Daftar + suspend + peran |
| `/admin/pengguna/[id]` | S26 | `user:read` | Profil, sesi, pesanan, unduhan |
| `/admin/media` | — | `media:read` | Pustaka, unggah (`media:write`), hapus (`media:delete`) |
| `/admin/ulasan` | S24 | `item:publish` \| `tutorial:publish` | Antrean approval + diff |
| `/admin/pengaturan` | S27 | `setting:read` | Tab: Identitas, Umum, Harga, Pembayaran, Iklan, Email, SEO, Keamanan |
| `/admin/audit` | S28 | `audit:read` | Log + filter + ekspor (`audit:export`) |

Aturan: `pengaturan` mengubah data hanya bila `setting:update` — tab tetap terlihat, field read-only, dengan penjelasan.

Catatan implementasi M3:

- Ringkasan `/admin` tidak memakai kapabilitas: semua admin yang sudah ber-MFA boleh melihat antreannya. Seluruh rute lain memakai `requireCapability(...)` dengan peta yang sama seperti tabel di atas (`src/lib/admin/route-capability.ts`).
- `/admin/mfa` adalah satu-satunya rute panel yang boleh dibuka **tanpa** MFA aktif; proxy mengalihkan rute panel lain ke sana (AC-ADM-11).
- Daftar kapabilitas per rute di tabel ini adalah sumber kebenaran untuk dua tempat: guard halaman dan `adminPathCapability()` di proxy. Keduanya diuji agar tidak menyimpang (`rbac.spec`).

---

## 6. Rute auth, API, dan sistem

### Auth (5)

| Rute | Runtime | Guard | Catatan |
| --- | --- | --- | --- |
| `/api/auth/[...nextauth]` | Node | publik | Auth.js: signin, callback, session, csrf |
| `/api/auth/google` | Node | publik | Alias paritas; validasi `redirect` internal |
| `/api/auth/mfa/enroll` | Node | USER | Kembalikan secret + QR (sekali) |
| `/api/auth/mfa/verify` | Node | USER | TOTP; rate limit 5/menit |
| `/api/auth/mfa/disable` | Node | USER | Wajib TOTP + reauth |

Catatan implementasi M3: alur admin **tidak** memakai route handler `/api/auth/mfa/*` maupun `/api/auth/[...nextauth]`. Login, verifikasi TOTP, enrol, dan logout dijalankan sebagai Server Action di `src/app/(auth)/actions.ts` dan `src/app/(admin)/admin/mfa/actions.ts`, dengan halaman `/login`, `/login/mfa`, `/admin/mfa`. Alasannya ada di `06-milestones.md` (deviasi M3): Auth.js Credentials tidak mendukung database session, sedangkan FR-AUTH-03/06 membutuhkan sesi yang bisa dicabut. Route handler MFA tetap dicadangkan untuk klien non-browser; bila tidak dipakai sampai M4, baris di atas dihapus dari dokumen.

### Unduhan (4)

| Rute | Runtime | Guard | Cache | Catatan |
| --- | --- | --- | --- | --- |
| `/api/download/[slug]` | Node | publik | `no-store` | `302` ke ads (FREE), `303` ke berkas (PREMIUM berhak), `303 ?beli=1`, `410`/`404` halaman |
| `/api/download/[slug]/token` | Node | publik + `dl_gate` | `no-store` | Form → `303` ke berkas; JSON → `201`; `429` + `Retry-After`; gate dilewati bila `ads.enabled=false` |
| `/api/download/[slug]/meta` | Node | publik | `no-store` | `sizeBytes`, `resumable`, `warnLargeFile` |
| `/api/download/file/[token]` | **Node** (stream) | token valid | `no-store`, `Accept-Ranges: none` | Token diklaim atomik **sebelum** stream; `410` → halaman expired item |

### Perdagangan (5)

| Rute | Runtime | Guard | Catatan |
| --- | --- | --- | --- |
| `/api/orders` | Node | publik (guest) / USER | `Idempotency-Key` wajib |
| `/api/orders/[orderNo]` | Node | pemilik | 404 untuk bukan pemilik |
| `/api/orders/[orderNo]/sync` | Node | pemilik | Maks 3×/jam |
| `/api/webhooks/doku` | Node | signature | Selalu 200 setelah tercatat |
| `/api/requests` + `/api/requests/[token]` | Node | publik | Honeypot, rate limit |

### Admin API (2)

| Rute | Runtime | Guard | Catatan |
| --- | --- | --- | --- |
| `/api/admin/media` | Node | `media:write` | Maks 5 MB, `multipart/form-data` |
| `/api/admin/export/[entity]` | Node | `audit:export` | CSV streaming, rentang ≤ 90 hari |

### Sistem (4)

| Rute | Isi | Cache |
| --- | --- | --- |
| `/sitemap.xml` | Dinamis, `lastmod`, tanpa arsip | `s-maxage=3600` |
| `/robots.txt` | Disallow `/admin`, `/dashboard`, `/api` | `s-maxage=86400` |
| `/manifest.webmanifest` | `theme_color #58d3db`, ikon 192/512 | `s-maxage=86400` |
| `/api/health` | `db`, `redis`, `drive` | `no-store` |

---

## 7. Matriks guard

| Prefix | Anonim | USER | ADMIN tanpa kapabilitas | ADMIN dengan kapabilitas | SUPERADMIN |
| --- | --- | --- | --- | --- | --- |
| `/` , `/source-code*`, `/tutorial*`, `/donasi*`, `/request*`, `/jasa*`, `/kontak`, `/kebijakan*`, `/syarat*` | 200 | 200 | 200 | 200 | 200 |
| `/download/*` | 200 | 200 | 200 | 200 | 200 |
| `/checkout/[orderNo]` | 200 (token) / 404 | 200 (pemilik) | 200 | 200 | 200 |
| `/login`, `/register` | 200 | 200 (dashboard: M4) | 307 → `/admin/mfa` (MFA off) / `/admin` | idem | idem |
| `/dashboard*` | 307 → `/login?redirect=` | 200 | 200 | 200 | 200 |
| `/admin` | 307 → `/login?redirect=/admin` | **403** | 307 → `/admin/mfa` bila MFA off, selain itu 200 | 200 | 200 |
| `/admin/mfa` | 307 → login | 403 | 200 | 200 | 200 |
| `/admin/item*` | 307 → login | 403 | 307 → `/admin/mfa` bila MFA off, selain itu 403 tanpa `item:read` | 200 (`item:read`) | 200 |
| `/admin/pengaturan` | 307 → login | 403 | 307 → `/admin/mfa` bila MFA off, selain itu 403 | 403 | 200 |
| `/api/*` (kecuali publik) | 401 | 401/403 | 403 | 200 | 200 |

Catatan: `USER` yang membuka `/admin` mendapat **403**, bukan redirect dan bukan 404 — ini keputusan sadar (AC-ADM-09) agar pengguna tahu panel itu ada tetapi bukan haknya. Di log, kejadian ini dicatat.

Urutan evaluasi guard di proxy: **sesi tidak ada → 307 login**, **sesi tidak sah/kedaluwarsa → 307 login + hapus cookie**, **peran bukan admin → 403**, **MFA belum aktif → 307 `/admin/mfa`**, **kapabilitas kurang → 403**. Artinya USER yang juga belum ber-MFA tetap menerima 403, bukan dialihkan ke halaman enrol. Bila database tidak terjangkau, proxy meneruskan permintaan (bukan menganggapnya "keluar"); halaman lalu menampilkan `503`/error dan sesi tidak dihapus.

---

## 8. Kebijakan redirect

| Kondisi | Kode | Tujuan | Sumber |
| --- | --- | --- | --- |
| Apex `reditech.id` | `308` | `https://www.reditech.id` + path | Caddy + proxy |
| Trailing slash | `308` | Tanpa slash | Next default |
| Path huruf besar | `308` | Huruf kecil | Proxy |
| Path token unduhan `/api/download/file/*` | — | **dikecualikan** dari aturan di atas | Proxy: nilai base64url peka huruf besar-kecil |
| `/download/[slug]/ads` untuk item `PREMIUM` | `303` | `/source-code/[slug]?beli=1` | Proxy (sebelum render) |
| `?page` > total | `308` | Halaman terakhir, filter lain dipertahankan | Proxy |
| `?page` < 1 / bukan angka / desimal | `308` | `page=1` | Proxy |
| Parameter tidak kanonik (urutan, `page=1`, `sort=newest`, `type` huruf kecil) | `308` | URL kanonik §3 | Proxy |
| `?page=99&utm_source=…` | `308` | Halaman terakhir, `utm_*` dibuang | Proxy (rentang dicek sebelum daftar parameter dikenal) |
| Slug item berubah | `308` | Slug baru (tabel `Redirect`) | Route *(M4)* |
| Slug item diarsipkan | **410** | — (tanpa redirect) | Proxy, lihat §9 |
| Item draf/tidak ada | **404** | — | Proxy |
| `/login` saat sudah masuk sebagai admin | `307` | `/admin/mfa` (MFA off) atau `/admin` | Halaman `/login` |
| `/admin/*` tanpa sesi | `307` | `/login?redirect=<path>` | Proxy |
| `/admin/*` dengan sesi tidak sah/kedaluwarsa | `307` | `/login` + cookie `rd_session` dihapus | Proxy |
| `/admin/*` (selain `/admin/mfa`) saat MFA belum aktif | `307` | `/admin/mfa` | Proxy + layout |
| `/login/mfa` tanpa cookie tantangan `rd_mfa` | `307` | `/login?redirect=<tujuan>` | Proxy |
| `/dashboard/*` tanpa sesi | `307` | `/login?redirect=<path>` | Proxy *(M3/M4)* |
| `/checkout/*` bukan pemilik | `404` | — | Route |
| Token invoice/request tidak valid | `404` | — | Route |
| Query param tak dikenal (`utm_*`, `fbclid`) | 200 | Dipertahankan apa adanya | Proxy melewati kanonikalisasi |

Alasan memilih `308` untuk kanonikalisasi: metode dan body dipertahankan (relevan bila pengguna mem-bookmark hasil filter). `307` dipakai untuk alur sesi karena bukan kanonikalisasi URL.

Catatan: kanonikalisasi katalog **tidak** dilakukan di halaman, melainkan di proxy. Begitu shell PPR terkirim, `permanentRedirect` di dalam `<Suspense>` hanya menjadi pengalihan sisi klien dan respons HTTP-nya sudah `200` — bukan `308`.

---

## 9. Status kode dan halaman error

| Kode | Kapan | Implementasi |
| --- | --- | --- |
| 200 | Normal | — |
| 307 | Alur sesi, pemulihan | `redirect()` |
| 308 | Kanonikalisasi | Proxy + Caddy |
| 400 | Validasi query gagal berat (mis. `page` ganda) | `error.tsx` segmen |
| 401 | API tanpa sesi | Route handler |
| 403 | Izin kurang, `USER` membuka panel | Proxy replay `/403`; `forbidden()` sebagai jaring pengaman di dalam render |
| 404 | Item/order/token tidak ada | Proxy rewrite ke `/404` (item) / `notFound()` (sisanya) |
| 410 | Item diarsipkan; token unduhan kedaluwarsa/terpakai | Proxy replay `/410`; route handler berkas replay `/download/[slug]/expired` |
| 429 | Rate limit | Route handler + `Retry-After` |
| 500 | Kesalahan server | `global-error.tsx` |
| 503 | DB/Drive/DOKU tidak tersedia | Route handler / halaman pemeliharaan |

**Catatan implementasi status (terverifikasi di Next 16.4.3, `next start`):**

1. Status HTTP harus ditentukan **sebelum** shell PPR dikirim. `permanentRedirect()` dan `notFound()` yang dipanggil di dalam batas `<Suspense>` hanya menghasilkan pengalihan/soft-404 sisi klien dengan status `200`. Karena itu validasi `page` dan status item dikerjakan di `src/proxy.ts`.
2. `rewrite('/404', { status: 404 })` bekerja apa adanya: Next memperlakukan `pathname === '/404'` sebagai halaman 404 dan mempertahankan status dari rewrite.
3. `rewrite('/410', { status: 410 })` **tidak** bekerja di `next start`: `/410` diprerender statis, dan entri cache itu membalas `200` sehingga menimpa status dari proxy (di `next dev` sempat tampak bekerja). Solusinya: proxy `fetch` `/410` dengan header internal `x-reditech-status-page: 1` (guard melewati semua cabang), lalu membalas `new NextResponse(html, { status: 410 })`. Hasil: `HTTP/1.1 410 Gone` + isi halaman 410.
4. `STATIC_STATUS_PAGES` hanya berisi `'/500'`; tidak ada API halaman untuk 410, jadi replay di atas adalah cara yang dipakai sampai Next menyediakannya. Bila kelak tersedia, hapus `statusPage()` dan kembalikan ke `rewrite`.
5. Untuk **403**, `forbidden()` tidak cukup: diuji di M3 bahwa ketika layout melempar `forbidden()`, segmen halaman tetap dirender dan HTML-nya tetap terkirim (dengan status `200` bila shell sudah terkirim). Karena itu `403` untuk `/admin` ditentukan proxy dengan pola replay yang sama seperti `/410` — `fetch('/403')` + `x-reditech-status-page: 1` lalu dibalas dengan status `403`. `src/app/forbidden.tsx` tetap ada sebagai jaring pengaman bila hak akses berubah di tengah render, dan keduanya merender `ForbiddenView` yang sama.
6. Route handler juga memakai replay yang sama (`src/lib/http/status-page.ts`) untuk `404`/`403`/`410`, karena route handler tidak punya API rewrite ke halaman. Permintaan replay membawa header `x-reditech-status-page: 1`; proxy melewatinya agar tidak terjadi perulangan.
7. Token unduhan yang sudah terpakai **tetap** membalas `410` dengan halaman item yang benar (`/download/[slug]/expired`), bukan `410` generik: pengguna harus bisa meminta tautan baru tanpa kehilangan konteks item.

Halaman yang wajib ada: `not-found.tsx` (root), `error.tsx` (publik), `global-error.tsx`, `403`, `404`, `410`, `offline`.

---

## 10. Metadata & SEO

| Aturan | Nilai |
| --- | --- |
| Template judul | `%s · Reditech` |
| Judul beranda | `Reditech — Source code siap pakai untuk developer Indonesia` |
| Deskripsi beranda | 120–155 karakter, menyebut katalog, gratis, dan premium |
| Canonical | `https://www.reditech.id` + path + parameter diurutkan (§3) |
| OG image | Dinamis per item/tutorial (1200×630), fallback statis |
| Twitter | `summary_large_image` |
| JSON-LD | `Organization` (root), `Product` + `BreadcrumbList` (item — M1), `Article` (tutorial — M6) |
| `robots` | Publik: index; dashboard/admin/checkout/invoice/auth/download: noindex |
| Sitemap | Item & tutorial `PUBLISHED`; `lastmod` dari `updatedAt`; tanpa URL ber-query |
| `hreflang` | Tidak dipakai (satu bahasa) |

Sitemap tidak memuat: `/login`, `/register`, `/dashboard*`, `/admin*`, `/checkout*`, `/invoice*`, `/request/[token]`, `/download/*`.

Catatan implementasi M1:

- `Product` dan `BreadcrumbList` dikirim sebagai satu `@graph` dari komponen `src/components/seo/item-jsonld.tsx`. `image` wajib absolut, jadi URL media dirakit dengan `SITE_URL` lalu di-dedupe (thumbnail = screenshot pertama).
- Item gratis dilaporkan `offers.price = 0`; harga premium memakai `priceIdr`. `aggregateRating` sengaja tidak diisi sampai ada ulasan nyata (M4).
- Aset seed berupa SVG (`public/seed/*.svg`) valid untuk JSON-LD, tetapi Google Product mensyaratkan gambar raster — di produksi media berasal dari R2 (JPEG/WebP).
- Sitemap memakai `connection()` dan `try/catch`, sehingga database yang belum siap tidak menggagalkan build: rute statis tetap terkirim.

---

## 11. Cache & revalidasi

| Rute | Strategi | Tag | Dipicu ulang oleh |
| --- | --- | --- | --- |
| `/` | ISR 60 s | `items`, `sponsors` | Publish/arsip item, sponsor aktif |
| `/source-code` | Dinamis | — | — (selalu segar) |
| `/source-code/[slug]` | ISR 60 s | `item:<slug>`, `items` | Edit/publish/harga item |
| `/tutorial` | ISR 300 s | `tutorials` | Publish tutorial |
| `/tutorial/[slug]` | ISR 300 s | `tutorial:<slug>` | Edit/publish tutorial |
| `/donasi` | ISR 60 s | `sponsors` | Sponsor aktif/kedaluwarsa |
| Legal & jasa & kontak | Statis | — | Build ulang |
| Dashboard & admin | `no-store` | — | — |
| `/download/*` | Dinamis (cookie + waktu) | — | — (selalu segar) |
| `sitemap.xml` | Dinamis (`connection()`), DB gagal → rute statis saja | — | — |

Catatan implementasi M1 (Cache Components):

- ISR di atas diwujudkan sebagai `"use cache"` + `cacheLife("minutes")` pada fungsi data, bukan `revalidate` rute (`export const revalidate` dilarang saat `cacheComponents: true`).
- `getFeaturedItems()` — tag `items`; `getItemDetail(slug)` — tag `item:<slug>` + `items`; `getCatalogCategories()` — tag `hours`/`categories`. Admin (M3) memanggil `revalidateTag` dengan tag yang sama.
- `getItemStatus()` **tidak** di-cache: proxy harus melihat item yang baru diarsipkan seketika, bukan 60 detik kemudian.
- Halaman katalog sengaja tidak di-cache; hasilnya selalu berasal dari query terbaru dan shell PPR-nya tetap statis.

Header respons:

| Aset | `Cache-Control` |
| --- | --- |
| HTML halaman berpengguna | `private, no-cache, no-store, max-age=0, must-revalidate` |
| HTML `/download/*` | `private, no-cache, no-store, max-age=0, must-revalidate` + `X-Robots-Tag: noindex, nofollow` |
| HTML publik | `public, max-age=0, must-revalidate` (edge mengikuti aturan Cloudflare) |
| `/_next/static/*` | `public, max-age=31536000, immutable` |
| Gambar R2 | `public, max-age=31536000, immutable` |
| `/api/*` | `private, no-store` |

Cloudflare: cache rule hanya untuk `/_next/static/*` dan `/uploads/*`; **semua HTML bypass cache** agar perilaku `cf-cache-status: DYNAMIC` tetap sama seperti acuan.

---

## 12. Proxy (dulu middleware)

Next.js 16 mengganti konvensi `middleware.ts` menjadi `proxy.ts` (export `proxy` atau default). Nama lama masih jalan tetapi deprecated, jadi dipakai `src/proxy.ts`.

```ts
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads/|cdn-cgi/).*)'],
}
```

Urutan kerja proxy (`src/proxy.ts`, diperbarui di M3):

1. Permintaan internal halaman status (`x-reditech-status-page: 1`) → lanjutkan tanpa cabang lain.
2. Apex → `www` (`308`). Caddy juga menangani ini; proxy menjadi jaring pengaman.
3. Path huruf besar → huruf kecil (`308`), **kecuali** `/api/download/file/*` (token base64url peka huruf besar-kecil).
4. Katalog `GET /source-code`: normalisasi + validasi `page` → `308` ke URL kanonik (§3), **sebelum** render.
5. Item `GET /source-code/[slug]`: `getItemStatus()` → `410` (replay halaman `/410`), `404` (rewrite ke `/404`).
6. Halaman unduhan `GET /download/[slug]/{ads,expired}`: `getItemAccess()` → `404`/`410`; item `PREMIUM` di `/ads` → `303 ?beli=1`; pasang cookie `dl_gate` bila belum ada. Server Component tidak boleh menulis cookie, jadi satu-satunya tempat pemasangan adalah proxy; render pertama belum melihat cookie itu dan memulai hitung mundur dari durasi penuh.
7. Panel `GET /admin*`: baca sesi dari cookie `rd_session` (token di-hash, satu kueri), lalu berurutan — tanpa sesi `307 /login?redirect=…`; sesi tidak sah/kedaluwarsa `307 /login` + hapus cookie; peran bukan admin `403`; MFA belum aktif `307 /admin/mfa` (kecuali `/admin/mfa`); kapabilitas rute kurang `403`.
8. Verifikasi MFA `GET /login/mfa`: tanpa cookie tantangan `rd_mfa` → `307 /login?redirect=…`.
9. Susun CSP + header keamanan + `Cache-Control` per jenis path (`/admin`, `/dashboard`, `/download` → private + noindex; `/api` → `private, no-store`), lalu teruskan dengan header `X-Request-Id` dan `X-Pathname`.

Catatan M3:

- Langkah 7 dan 8 butuh database, dan proxy Next 16 berjalan di runtime Node.js, jadi aman memakai Prisma. Modul yang dipakai proxy (`src/lib/auth/proxy-session.ts`) sengaja **tidak** mengimpor `next/headers`.
- `X-Pathname` diteruskan ke aplikasi agar layout panel tahu rute aktif (layout tidak menerima URL) dan bisa menegakkan gerbang MFA sebagai lapisan kedua.
- Bila database tidak terjangkau saat membaca sesi, permintaan diteruskan tanpa keputusan otorisasi (bukan dianggap "keluar"); halaman akan menampilkan kesalahan yang sebenarnya.
- Status `403` dikirim lewat replay `/403`, bukan `rewrite`, karena Next memperlakukan `/403` seperti halaman biasa dan status dari `rewrite` tidak dijamin bertahan pada rute yang diprerender.

### 12.0 Mengapa status ditentukan di proxy

Dengan `cacheComponents: true`, Next mengirim shell PPR lebih dulu; keputusan status di dalam batas `<Suspense>` sudah terlambat:

| Percobaan | Hasil |
| --- | --- |
| `permanentRedirect()` di dalam `<Suspense>` | `200` + pengalihan sisi klien |
| `notFound()` di dalam `<Suspense>` | `200` + soft-404 |
| `rewrite('/404', { status: 404 })` | `404` (Next memperlakukan `/404` sebagai halaman 404) |
| `rewrite('/410', { status: 410 })` | `200` di `next start` — entri cache statis `/410` menang |
| Replay: `fetch('/410')` → `NextResponse(html, { status: 410 })` | `410` |

Karena itu katalog dan item memakai proxy. Halaman `/` dan `/tutorial` tidak butuh perlakuan khusus.

Detail replay: proxy meminta `/410` dengan header internal, guard langsung meloloskan permintaan itu (tanpa loop), lalu HTML-nya dibalas ulang dengan status `410` dan header keamanan yang sama. Biaya satu render internal hanya dibayar saat item arsip benar-benar diakses, dan halaman 410 tetap boleh di-cache oleh CDN bila dikehendaki.

### 12.1 CSP: mengapa tanpa nonce

Rencana awal memakai nonce per permintaan. Setelah diverifikasi di Next 16 dengan `cacheComponents: true`, nonce **tidak dapat dipakai**:

1. Next hanya menyuntikkan nonce ke `<script>` saat SSR, dan syaratnya halaman dirender dinamis.
2. Cache Components selalu mem-prerender **shell statis** (PPR) untuk setiap rute — termasuk `/admin/*`. Skrip di shell itu dibekukan saat build, ketika belum ada request.
3. Bila CSP memuat nonce + `'strict-dynamic'`, browser mengabaikan `'self'` dan memblokir semua skrip shell yang tidak ber-nonce. Hasil verifikasi build: hanya 6 dari 19 `<script>` pada `/admin` yang mendapat nonce.

Keputusan: satu CSP tanpa nonce untuk semua rute.

| Direktif | Nilai |
| --- | --- |
| `default-src` | `'self'` |
| `script-src` | `'self' 'unsafe-inline'` (+ `'unsafe-eval'` hanya di pengembangan) |
| `style-src` | `'self' 'unsafe-inline'` |
| `img-src` | `'self' data: blob: https://*.r2.dev https://cdn.reditech.id` |
| `font-src` | `'self' data:` |
| `connect-src` | `'self' https://api.doku.com https://sandbox.doku.com` |
| `frame-ancestors` / `object-src` | `'none'` |
| `base-uri` / `form-action` | `'self'` |
| `upgrade-insecure-requests` | hanya bila permintaan efektif https |

Catatan M3 tentang `upgrade-insecure-requests`: direktif ini sempat dikirim tanpa syarat dan merusak pengembangan lokal. Saat `next start` diakses lewat `http://localhost:3100`, browser menaikkan prefetch RSC internal (`http://localhost:3100/admin/mfa`) menjadi `https://…` dan gagal dengan `ERR_SSL_PROTOCOL_ERROR`; router klien lalu bertahan di halaman lama sehingga dua shell (`login` dan `admin`) sempat tampil bersamaan. Protokol efektif ditentukan dari `x-forwarded-proto` (di produksi TLS berakhir di Caddy/Cloudflare) dan baru kemudian `nextUrl.protocol`. Di produksi direktifnya selalu ada.

Konsekuensi dan kompensasi:

- `'unsafe-inline'` melemahkan pertahanan XSS pada skrip. Karena HTML kita tidak pernah merender masukan pengguna (deskripsi item ditulis admin, bukan komentar publik), permukaan serangannya kecil.
- Direktif lain tetap ketat: tidak ada `object`/`embed`, tidak ada `<base>` asing, form hanya ke origin sendiri, tidak bisa di-iframe.
- Pemicu untuk kembali ke nonce: bila ada UGC yang dirender sebagai HTML, atau bila Next menghapus shell statis dari Cache Components. Pada titik itu rute terkait dibuat dinamis penuh dan CSP-nya dipisah.

Alternatif yang ditolak: memaksa seluruh aplikasi dinamis (`await connection()` di root) agar nonce berlaku — itu membatalkan ISR/PPR yang menjadi syarat performa di §11, dan tidak sepadan hanya demi nonce.

### 12.2 `params` dan Cache Components

Dengan `cacheComponents: true`, rute yang membaca `params`/`searchParams` di luar `<Suspense>` gagal saat prerender. Di M0 semua rute dinamis memakai `export const instant = false` (rute memang bukan navigasi instan). M1 menggantinya dengan `<Suspense>` + skeleton agar shell tetap instan; `instant = false` hanya dipertahankan untuk halaman panel yang memang menunggu data.

Catatan tambahan M3: `Date.now()` ikut dilarang saat prerender. `/login/mfa` membandingkan kedaluwarsa tantangan dengan waktu sekarang, jadi halaman itu memanggil `await connection()` sebelum membaca cookie — `instant = false` saja tidak cukup karena fungsinya tetap dicoba dijalankan saat prerender. Gejalanya sebelumnya: log `next start` berisi "Next.js encountered the unstable value `Date.now()` while prerendering" dan halaman verifikasi gagal dirender.

### 12.3 Sesi admin: cookie, TTL, dan tiga lapis otorisasi

| Cookie | Isi | TTL | Ditulis oleh |
| --- | --- | --- | --- |
| `rd_session` | token acak 32 byte (base64url); DB menyimpan sha256-nya | 8 jam untuk admin, 30 hari untuk pengguna | Server Action login/logout |
| `rd_mfa` | `v1.<userId>.<expires>.<hmac>` — hanya bukti kata sandi sudah benar | 5 menit | Server Action login |
| `rd_stepup` | dicadangkan untuk aksi sensitif | 10 menit | belum dipakai |

Otorisasi ditegakkan di **tiga** tempat, bukan satu:

1. **Proxy** — menentukan status HTTP final (307/403) sebelum shell PPR terkirim.
2. **Halaman** — setiap `page.tsx` di `(admin)` memanggil `requireAdmin()`/`requireCapability()`; layout hanya untuk tampilan dan navigasi.
3. **Server Action** — setiap aksi memanggil `actionActor(capability)` dan mengembalikan `{ error }` bila gagal, karena aksi dapat dipanggil langsung tanpa melewati render halaman.

Alasan layout tidak dijadikan batas: diuji di M3 bahwa `forbidden()` di layout **tidak** menghentikan render segmen halaman — HTML halaman tetap diserialisasi ke respons. Karena itu satu-satunya batas yang benar adalah kombinasi proxy + guard per halaman + guard per aksi.

---

## 13. Traceability layar → rute

| Layar | Rute | Requirement | Test |
| --- | --- | --- | --- |
| S01 | `/` | FR-CAT-01 | `home.spec` |
| S02 | `/source-code` | FR-CAT-02..13 | `catalog.spec`, `pagination.spec` |
| S03 | `/source-code/[slug]` | FR-ITEM-01..09 | `detail-*.spec` |
| S04 | `/download/[slug]/ads` | FR-DL-02..03 | `download-free.spec` |
| S04 (kedaluwarsa) | `/download/[slug]/expired` | FR-DL-04 | `download-free.spec`, `download-premium.spec` |
| API unduhan | `/api/download/[slug]`, `.../token`, `.../meta`, `/api/download/file/[token]` | FR-DL-01..09 | `download-free.spec` |
| S05–S06 | `/login`, `/register` | FR-AUTH-01..03 | `auth.spec` |
| S07–S08 | `/tutorial*` | FR-CMS-01..02 | `tutorial.spec` |
| S09 | `/donasi*` | FR-CMS-03..04 | `sponsor.spec` |
| S10 | `/request-aplikasi`, `/request/[token]` | FR-CMS-05 | `request.spec` |
| S11–S14 | `/jasa*`, `/kontak`, legal | FR-CMS-06..07 | `static.spec` |
| S15–S19 | `/dashboard*` | FR-DASH-01..07 | `dashboard.spec` |
| S20 | `/dashboard/profile*` | FR-AUTH-04..05, MFA | `profile.spec` |
| S21 | `/checkout/[orderNo]` | FR-PAY-01..11 | `checkout.spec` |
| S22–S28 | `/admin*` | FR-ADM-01..20 | `admin-*.spec`, `rbac.spec` |
| S29 | `/403` | AC-ADM-09 | `rbac.spec` |

---

## 14. Yang belum diputuskan

| Hal | Dampak | Default sementara |
| --- | --- | --- |
| Status 410 & 403 pada App Router | Bisa jadi 200/404 | Selesai: keduanya direplay proxy (`/410`, `/403`) — lihat §9 |
| `/admin/pengaturan` per tab: segment atau query | Memengaruhi URL yang dishare | Query `?tab=` |
| Bahasa URL | Tidak ada i18n | Tanpa prefix |
| Preview draft (`/preview/[token]`) | Editor ingin melihat item `DRAFT` | Belum dibuat; ditunda ke v1.1 |
| PWA offline penuh | `/offline` ada, service worker belum | Ditunda |
