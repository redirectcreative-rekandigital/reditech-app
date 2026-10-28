# Superadmin & Pengelolaan Konten

| Field | Isi |
| --- | --- |
| Cakupan | Panel `/admin`, model peran, CRUD seluruh konten, pesanan, entitlement, pengguna, pengaturan, audit |
| Status bukti | **Dirancang, tidak teramati.** Investigasi tidak pernah membuka `/admin` (diblokir `robots.txt`, tanpa kredensial). Seluruh isi dokumen ini adalah usulan desain, bukan rekonstruksi. |
| Rujukan | [`01-prd.md`](01-prd.md), [`03-data-model.md`](03-data-model.md), [`04-api-spec.md`](04-api-spec.md) |

---

## 1. Prinsip

1. **Satu pemilik tunggal.** SUPERADMIN memegang **seluruh** izin, tanpa pengecualian, termasuk konten, harga, pesanan, pengguna, dan pengaturan.
2. **Tidak ada konten yang tayang tanpa jejak.** Setiap perubahan konten menghasilkan baris revisi + baris audit.
3. **Peran tambahan bersifat meminjam izin**, bukan meminjam peran. ADMIN tidak otomatis mewarisi apa pun; izinnya diberikan eksplisit per kapabilitas.
4. **Pemisahan tugas untuk uang dan publikasi.** Perubahan harga, penerbitan item, refund, dan pencabutan akses butuh aktor dengan kapabilitas khusus — bukan editor biasa.
5. **Penghapusan lunak.** Konten tidak pernah hilang seketika; diarsipkan 30 hari sebelum pembersihan permanen.

---

## 2. Model peran

| Peran | Deskripsi | Siapa |
| --- | --- | --- |
| `VISITOR` | Tanpa akun | Publik |
| `USER` | Akun pembeli/pengunduh | Hasil OAuth Google |
| `ADMIN` | Editor berizin terbatas; **izinnya berupa daftar kapabilitas**, bukan peran tetap | Diberi undangan oleh SUPERADMIN |
| `SUPERADMIN` | Pemilik. Semua kapabilitas, melewati semua pemeriksaan izin | Akun pemilik, dibuat lewat seed |

Catatan implementasi: pemeriksaan izin memakai fungsi tunggal `can(actor, capability)`. Bila `actor.role === 'SUPERADMIN'` → selalu `true`. Selain itu, periksa `actor.permissions` (array kapabilitas). Tidak ada pemeriksaan berbasis nama peran di kode fitur — hanya kapabilitas. Ini mencegah aturan tersebar dan sulit diaudit.

### 2.1 Daftar kapabilitas

| Grup | Kapabilitas |
| --- | --- |
| Item | `item:read`, `item:write`, `item:publish`, `item:delete` |
| Taksonomi | `taxonomy:read`, `taxonomy:write`, `taxonomy:delete` |
| Tutorial | `tutorial:read`, `tutorial:write`, `tutorial:publish`, `tutorial:delete` |
| Sponsor | `sponsor:read`, `sponsor:moderate`, `sponsor:delete` |
| Request | `request:read`, `request:write`, `request:delete` |
| Media | `media:read`, `media:write`, `media:delete` |
| Perdagangan | `order:read`, `order:refund`, `entitlement:grant`, `entitlement:revoke` |
| Unduhan | `download:read` |
| Pengguna | `user:read`, `user:suspend`, `user:role:manage` |
| Pengaturan | `setting:read`, `setting:update` |
| Audit | `audit:read`, `audit:export` |

### 2.2 Bundel siap pakai

| Bundel | Isi | Untuk |
| --- | --- | --- |
| **Editor** | `item:read/write`, `taxonomy:read/write`, `tutorial:read/write`, `media:*`, `sponsor:read`, `request:*`, `order:read`, `audit:read` | Kontributor konten. **Tidak bisa menerbitkan, menghapus, atau mengubah harga.** |
| **Publisher** | Editor + `item:publish`, `tutorial:publish`, `sponsor:moderate` | Menyetujui antrean publikasi |
| **Commerce Ops** | `order:read`, `order:refund`, `entitlement:grant/revoke`, `download:read` | Penanganan masalah transaksi |
| **User Admin** | `user:read`, `user:suspend` | Dukungan pengguna |
| **Superadmin** | Semua di atas + `taxonomy:delete`, `item:delete`, `tutorial:delete`, `sponsor:delete`, `request:delete`, `media:delete`, `user:role:manage`, `setting:update`, `audit:export` | Pemilik |

### 2.3 Matriks izin per entitas

Legenda: **C** buat · **R** baca · **U** ubah · **P** terbitkan · **D** hapus · **—** tidak boleh

| Entitas | Anonim | USER | ADMIN (Editor) | ADMIN (+Publisher) | SUPERADMIN |
| --- | --- | --- | --- | --- | --- |
| Item | — | R (publik) | C R U | + P | C R U P D |
| Kategori / Teknologi | — | R | C R U | + P | C R U P D |
| Tutorial | — | R | C R U | + P | C R U P D |
| Sponsor | — | — | R | + P (moderasi) | C R U P D |
| Request aplikasi | C | C | R U | R U | C R U P D |
| Media | — | — | C R U | C R U | C R U D |
| Pesanan | C (checkout) | R (miliknya) | R | R | R + refund |
| Entitlement | — | R (miliknya) | R | R | R + grant/revoke |
| Unduhan | C | R (miliknya) | R | R | R |
| Pengguna | — | R (diri) | R | R | R U (peran, suspend) |
| Pengaturan | — | — | R | R | R U |
| Audit log | — | — | R | R | R + ekspor |

---

## 3. Alur persetujuan dua-orang (opsional, aktif bila ada ≥ 1 ADMIN)

| Aksi | ADMIN | SUPERADMIN |
| --- | --- | --- |
| Simpan draft | langsung | langsung |
| Terbitkan item/tutorial | masuk antrean `IN_REVIEW` | langsung terbit |
| Ubah harga item | **tidak boleh** (field harga read-only) | langsung + revisi |
| Arsipkan konten | masuk antrean | langsung |
| Hapus permanen | tidak boleh | langsung + konfirmasi ketik slug |
| Refund pesanan | tidak boleh | langsung + alasan wajib |
| Cabut entitlement | tidak boleh | langsung + alasan wajib |

Antrean tampil di `/admin/ulasan`. SUPERADMIN melihat diff sebelum/tengah/sesudah per field, bukan hanya "setujui".

---

## 4. Struktur informasi panel

```
/admin
├── /                       Ringkasan operasional
├── /item                   Daftar item (filter: status, tipe, kategori)
│   ├── /new
│   └── /[id]               Tab: Dasar · Konten · Harga · Berkas · Galeri · SEO · Riwayat
├── /kategori               CRUD kategori (+ urutan tampil)
├── /teknologi              CRUD teknologi
├── /tutorial               Daftar artikel
│   ├── /new
│   └── /[id]               Editor markdown/MDX + pratinjau
├── /sponsor                Daftar sponsor + antrean moderasi
├── /request                Pipeline usulan aplikasi
├── /pesanan                Daftar pesanan (filter status, tanggal, gateway)
│   └── /[orderNo]          Detail + timeline pembayaran + aksi
├── /entitlement            Daftar akses + pencarian per pengguna/item
├── /pengguna               Daftar pengguna + peran + undangan admin
│   └── /[id]               Profil, pesanan, unduhan, sesi aktif
├── /media                  Pustaka gambar (R2)
├── /ulasan                 Antrean persetujuan (ADMIN → SUPERADMIN)
├── /pengaturan             Identitas, Umum · Harga · Pembayaran · Iklan · Email · SEO · Keamanan
└── /audit                  Log audit (filter aktor, entitas, tanggal) + ekspor CSV
```

Aturan akses: middleware memeriksa `session.user.role` minimal `ADMIN`; setiap server action memanggil `requirePermission(capability)` sebagai lapis kedua. Route `/admin` tidak masuk sitemap, mengirim `X-Robots-Tag: noindex`, dan `Cache-Control: private, no-store`.

---

## 5. Ringkasan operasional (`/admin`)

| Kartu | Isi | Sumber |
| --- | --- | --- |
| Pendapatan 30 hari | Total `PAID` + `FULFILLED`, dibanding 30 hari sebelumnya | `Order` |
| Pesanan menunggu | Jumlah `PENDING` > 30 menit | `Order` |
| Unduhan hari ini | Gratis vs premium | `Download` |
| Antrean moderasi | Sponsor + request + publikasi | 3 tabel |
| Webhook gagal 24 jam | Jumlah + tautan ke log | `PaymentEvent` |
| Item perlu perhatian | Premium tanpa berkas valid, atau 0 unduhan 30 hari | `Item` |
| Ukuran storage | Total byte berkas Drive + R2 | `Item`, `Media` |

---

## 6. CRUD per entitas

### 6.1 Item source code

**Field dan aturan validasi**

| Field | Tipe | Aturan |
| --- | --- | --- |
| `slug` | teks | `^[a-z0-9]+(-[a-z0-9]+)*$`, 3–80, unik, **beku setelah terbit** (perubahan → baris `Redirect`) |
| `title` | teks | 8–120 |
| `type` | enum | `FREE` / `PREMIUM` |
| `status` | enum | `DRAFT` → `IN_REVIEW` → `PUBLISHED` → `ARCHIVED` |
| `shortDescription` | teks | 40–160 |
| `description` | markdown | wajib, maks 20.000 karakter |
| `howItWorks` | markdown | opsional, maks 10.000 |
| `features[]` | daftar | 0–30, tiap butir 3–120 karakter, berurutan |
| `installationSteps[]` | markdown | 0–20 langkah berurutan |
| `categoryId` | relasi | wajib, 1 kategori |
| `technologies[]` | relasi | 1–6 |
| `priceIdr` | integer | wajib bila `PREMIUM`, 1.000–50.000.000; harus `null` bila `FREE` |
| `noAdsPriceIdr` | integer | wajib bila `FREE` (default dari `Setting.noAdsPriceIdr` = 3.000); harus `null` bila `PREMIUM` |
| `license` | teks | 0–40, default `Gratis` / `Premium` |
| `releasedAt` | tanggal | tidak boleh masa depan > 1 hari |
| `demoUrl` | URL | https, opsional |
| `driveFileId` | teks | wajib untuk `PUBLISHED`, diverifikasi lewat tombol **Uji berkas** |
| `thumbnailMediaId` | relasi | wajib untuk `PUBLISHED` |
| `screenshots[]` | relasi | 1–8, berurutan |
| `seoTitle`, `seoDescription` | teks | opsional, fallback ke `title`/`shortDescription` |
| `featured` | boolean | tampil di beranda |

**Aturan publikasi (gate)** — tombol `Terbitkan` nonaktif dan alasannya ditampilkan bila salah satu gagal:

1. `driveFileId` ada dan lolos **Uji berkas** dalam 24 jam terakhir (server dapat membaca metadata + ukuran).
2. `thumbnailMediaId` ada.
3. Minimal 1 screenshot.
4. `PREMIUM` → `priceIdr > 0`; `FREE` → `noAdsPriceIdr > 0`.
5. `description` minimal 200 karakter.
6. Slug tidak bertabrakan dengan item `ARCHIVED` lain.

**Aksi**

| Aksi | Izin | Perilaku |
| --- | --- | --- |
| Simpan draft | `item:write` | Simpan + baris revisi |
| Ajukan publikasi | `item:write` | `DRAFT` → `IN_REVIEW`, masuk `/admin/ulasan` |
| Terbitkan | `item:publish` | Validasi gate, set `publishedAt`, revalidate ISR, kirim ke sitemap |
| Ubah harga | `item:publish` + SUPERADMIN | Tulis `ItemPriceHistory`, revisi, audit |
| Arsipkan | `item:publish` | `ARCHIVED`, hilang dari katalog, tautan lama → 410 |
| Duplikat | `item:write` | Salin sebagai `DRAFT` dengan slug `-copy` |
| Hapus permanen | `item:delete` | Hanya `ARCHIVED` > 30 hari; ketik slug untuk konfirmasi |

**Tampilan daftar**: kolom `Judul · Tipe · Harga · Status · Unduhan · Diperbarui`. Aksi massal: terbitkan, arsipkan, ubah kategori, ekspor CSV.

### 6.2 Kategori & teknologi

| Entitas | Field | Aturan |
| --- | --- | --- |
| Kategori | `name`, `slug`, `order`, `isActive` | Slug unik; urutan menentukan tampilan chip di katalog (paritas: 11 kategori) |
| Teknologi | `name`, `slug`, `color?` | Dipakai sebagai tag di kartu dan artikel |

Tidak boleh menghapus kategori yang masih dipakai item → nonaktifkan (`isActive=false`). Penghapusan hanya `taxonomy:delete` setelah 0 item terkait.

### 6.3 Tutorial

| Field | Aturan |
| --- | --- |
| `slug` | unik, beku setelah terbit |
| `title`, `excerpt` | 8–120 / 40–200 |
| `content` | MDX, maks 60.000 karakter |
| `heroMediaId` | wajib untuk terbit |
| `readMinutes` | integer 1–60, atau dihitung otomatis (200 kata/menit) |
| `tags[]` | 1–5 teknologi |
| `status` | `DRAFT` / `IN_REVIEW` / `PUBLISHED` / `ARCHIVED` |
| `publishedAt` | diisi saat terbit |

Editor menyediakan pratinjau sisi server (bukan iframe pihak ketiga) dan blok kode dengan Menlo, sesuai `design.md`.

### 6.4 Sponsor

| Field | Aturan |
| --- | --- |
| `link` | https, wajib, tanpa shortener (daftar blokir: bit.ly, sfl.gl, dll.) |
| `amountIdr` | 1.000–10.000.000 |
| `board` | enum 12 kategori papan (paritas dengan `/donasi`) |
| `description` | ≤ 140 karakter, opsional |
| `status` | `PENDING_REVIEW` → `ACTIVE` → `EXPIRED` / `REJECTED` |
| `startsAt`, `endsAt` | `ACTIVE` hanya bila dalam rentang |

Urutan tayang: **nominal menurun, lalu waktu bayar terlama**. Ini sesuai S&K ("urutan mengikuti nominal, bisa tergeser nominal lebih besar"). Moderasi wajib sebelum `ACTIVE` (RP-04); konten ilegal → `REJECTED` tanpa refund.

### 6.5 Request aplikasi (pipeline)

| Status | Arti | Notifikasi email |
| --- | --- | --- |
| `NEW` | Masuk | "Usulan diterima" |
| `REVIEWING` | Sedang ditinjau | — |
| `PLANNED` | Akan dibuat | "Masuk rencana" |
| `PUBLISHED` | Sudah jadi item | "Sudah terbit" + tautan item |
| `REJECTED` | Ditolak | "Belum bisa dibuat" + alasan |

Admin mengisi `internalNote` (tidak terlihat pengguna) dan `publicNote` (dikirim ke pengusul).

### 6.6 Media

- Unggah ke R2 dengan nama `hash` konten (`sha256`) → deduplikasi otomatis.
- Wajib `alt` (aksesibilitas, NFR-06).
- Simpan `width`, `height` untuk mencegah CLS; varian WebP/AVIF dibuat saat unggah.
- Pemakaian dilacak (`MediaUsage`) sehingga penghapusan ditolak bila masih dipakai.
- Batas unggah 5 MB per gambar; tipe diizinkan: JPEG, PNG, WebP.

### 6.7 Berkas source code (Drive)

- Field: `driveFileId`, `sizeBytes`, `checksum?`, `verifiedAt`.
- Tombol **Uji berkas** memanggil Drive API dan menampilkan nama, ukuran, dan izin akses service account.
- Berkas > 200 MB ditolak (`RS-01`).
- Berkas tidak pernah dibagikan publik; hanya service account yang punya akses.

### 6.8 Pesanan

| Aksi | Izin | Perilaku |
| --- | --- | --- |
| Lihat detail | `order:read` | Timeline: dibuat → invoice dibuat → webhook → entitlement |
| Cek status ke DOKU | `order:read` | Query ulang, sinkronkan bila berbeda |
| Tandai lunas manual | `order:refund` | Hanya bila bukti transfer diunggah; audit wajib |
| Refund | `order:refund` | Alasan wajib; cabut entitlement; status `REFUNDED` |
| Kirim ulang email akses | `order:read` | Rate limit 3/jam per order |

Detail pesanan menampilkan **snapshot** harga per baris (bukan harga item saat ini) agar riwayat tidak berubah saat harga naik.

### 6.9 Entitlement

- Tabel `Entitlement` (userId, itemId, orderId, grantedAt, revokedAt, source).
- Grant manual (`entitlement:grant`) untuk kasus kompensasi; wajib alasan + audit.
- Revoke (`entitlement:revoke`) seketika mematikan token aktif dan menolak unduhan baru.
- Daftar mendukung pencarian: `email`, `slug`, `orderNo`.

### 6.10 Pengguna

| Aksi | Izin | Catatan |
| --- | --- | --- |
| Lihat profil | `user:read` | Termasuk sesi aktif, pesanan, unduhan |
| Suspend | `user:suspend` | Semua sesi dicabut; login ditolak dengan pesan jelas |
| Ubah peran | `user:role:manage` | Hanya SUPERADMIN; tidak bisa menurunkan SUPERADMIN terakhir |
| Undang admin | `user:role:manage` | Undangan berumur 72 jam, terikat email; wajib MFA saat aktivasi |
| Hapus akun | `user:role:manage` | Anonimisasi, bukan hapus baris, agar audit & pembukuan tetap utuh |

### 6.11 Pengaturan

| Tab | Kunci | Contoh |
| --- | --- | --- |
| **Identitas** | `brand.logoLightMediaId`, `brand.logoDarkMediaId`, `brand.wordmarkMediaId`, `brand.faviconMediaId`, `brand.icon192MediaId`, `brand.icon512MediaId`, `brand.iconMaskableMediaId`, `brand.ogFallbackMediaId` | Aset di R2; kosong = fallback statis bertanda "default" |
| **Aset landing** | `landing.heroMediaId`, `landing.assets` (array `{ mediaId, slot, alt, href? }`) | Slot: `hero`, `fitur`, `cta`, `og-landing`; dikelola tanpa deploy |
| Umum | `site.name`, `site.tagline`, `site.whatsapp` | `Reditech` · tagline · nomor `08xx-xxxx-xxxx` (placeholder, ganti sebelum rilis) |
| Harga | `pricing.noAdsPriceIdr`, `pricing.serviceFeeIdr` | 3.000 · 21 |
| Pembayaran | `payment.provider`, `payment.expiryMinutes` | `DOKU` · 1.440 |
| Iklan | `ads.enabled`, `ads.interstitialSeconds`, `ads.adsenseClient` | true · 10 · `ca-pub-…` |
| Email | `email.fromAddress`, `email.replyTo` | |
| SEO | `seo.defaultTitle`, `seo.defaultDescription`, `seo.robots` | |
| Keamanan | `security.downloadDailyLimit`, `security.requireMfaForAdmin` | 5 · true |

Perubahan pengaturan disimpan sebagai baris revisi + audit; tidak ada penyimpanan diam-diam.

**Aturan aset merek dan landing.** Semua logo, favicon, ikon PWA, dan gambar landing adalah baris `Media` di R2 yang dipilih lewat `AssetField`; tidak ada aset merek yang di-hardcode sebagai berkas di `public/`.

- Pengaturan menyimpan `mediaId` (bukan URL), sehingga mengganti berkas dengan nama sama tidak mengubah kunci pengaturan. URL dirakit `mediaUrl()` saat render.
- `manifest.webmanifest`, metadata `icons` (favicon, apple-touch-icon), dan OG fallback membaca kunci yang sama. Bila kunci kosong, situs memakai fallback statis dan panel menandainya **default** — bukan diam-diam menganggap aset sudah diunggah.
- Menyimpan tab ini memanggil `revalidateTag("settings")` + `revalidateTag("brand")`; `manifest` dan metadata ikon tidak di-cache selamanya di edge (lihat `12-route-map.md` bagian 11).
- Media yang masih dirujuk pengaturan tidak boleh dihapus (FR-ADM-10); panel menampilkan daftar pemakaian.
- Aset landing memakai pustaka media yang sama. Menambah slot landing baru cukup lewat pengaturan; tidak perlu deploy, karena komponen landing membaca `landing.assets` dan mengabaikan slot yang belum dikenal.

---

## 7. Audit dan revisi

**`AdminAuditLog`** (append-only, tidak boleh `UPDATE`/`DELETE` dari role aplikasi):

| Kolom | Isi |
| --- | --- |
| `actorId`, `actorEmail` | Snapshot email agar tetap terbaca bila akun dihapus |
| `action` | `item.publish`, `order.refund`, `user.role.change`, … |
| `entityType`, `entityId` | Target |
| `before`, `after` | JSON diff terbatas pada field yang berubah |
| `ip`, `userAgent`, `requestId` | Korelasi dengan log aplikasi |
| `createdAt` | Waktu server |

**`Revision`** menyimpan versi konten (item/tutorial) sehingga diff antar versi bisa dilihat dan dipulihkan (`Restore` membuat versi baru, bukan menimpa riwayat).

Retensi audit: **2 tahun**, lalu diarsipkan ke R2 sebagai NDJSON. Ekspor CSV (`audit:export`) maksimum rentang 90 hari per ekspor.

---

## 8. Keamanan panel

| Kontrol | Aturan |
| --- | --- |
| MFA | Wajib untuk semua akun `ADMIN`/`SUPERADMIN` (TOTP). Login tanpa MFA → halaman enrol. |
| Step-up | Aksi sensitif (refund, hapus, ubah peran, ubah harga) meminta TOTP ulang bila sesi > 15 menit. |
| Sesi | Idle timeout 8 jam; token admin dirotasi saat MFA diaktifkan/dinonaktifkan. |
| Cakupan | `/admin` tidak di-cache, `noindex`, diblokir `robots.txt`. |
| Pemeriksaan | Middleware (route) + `requirePermission()` per server action + validasi Zod per input. |
| Rate limit | Login 10/menit/IP; aksi tulis 60/menit/aktor. |
| Notifikasi | Email ke SUPERADMIN saat admin baru login, MFA diubah, atau peran berubah. |
| Larangan | Admin tidak dapat mengubah perannya sendiri, dan tidak dapat menurunkan SUPERADMIN aktif terakhir. |

---

## 9. Keadaan antarmuka

| Keadaan | Perilaku |
| --- | --- |
| Memuat daftar | Skeleton baris (bukan spinner penuh halaman) |
| Kosong | Judul singkat + satu kalimat + CTA utama (pola sama dengan empty state publik) |
| Gagal memuat | Pesan + tombol `Coba lagi` + `requestId` untuk dilaporkan |
| Validasi gagal | Error per field, fokus pindah ke field pertama yang salah |
| Aksi berhasil | Toast ringkas + daftar diperbarui tanpa reload penuh |
| Aksi ditolak izin | Halaman 403 dengan penjelasan kapabilitas yang kurang, bukan 404 |
| Konflik versi | Bila `updatedAt` berubah sejak form dibuka → dialog "Data sudah berubah" + diff |

---

## 10. Acceptance criteria

| ID | Kriteria |
| --- | --- |
| AC-ADM-01 | SUPERADMIN dapat membuat, mengubah, menerbitkan, mengarsipkan, dan menghapus item tanpa deploy. |
| AC-ADM-02 | Item `PREMIUM` tidak bisa terbit bila `priceIdr` kosong atau berkas Drive tidak terverifikasi. |
| AC-ADM-03 | ADMIN tanpa `item:publish` tidak dapat menerbitkan; perubahannya masuk `/admin/ulasan`. |
| AC-ADM-04 | Setiap perubahan konten menghasilkan tepat satu baris audit dengan diff yang bisa dibaca. |
| AC-ADM-05 | Refund mengubah status pesanan, mencabut entitlement, dan mematikan token unduhan dalam < 5 detik. |
| AC-ADM-06 | Admin suspend pengguna → seluruh sesi pengguna tidak valid pada request berikutnya. |
| AC-ADM-07 | Perubahan harga tidak mengubah total invoice lama (snapshot utuh). |
| AC-ADM-08 | Penghapusan media yang masih dipakai ditolak dengan daftar pemakaian. |
| AC-ADM-09 | Akses `/admin` oleh `USER` → 403 (bukan 404, bukan redirect ke login). |
| AC-ADM-10 | Ekspor audit 90 hari selesai < 30 detik dan berisi minimal kolom aktor, aksi, entitas, waktu. |
| AC-ADM-11 | MFA wajib: akun admin tanpa TOTP tidak bisa mencapai route `/admin/*` selain halaman enrol. |
| AC-ADM-12 | Semua aksi destruktif memerlukan konfirmasi bertipe (slug/email) dan tercatat. |

---

## 11. Yang tetap tidak diketahui

Panel asli situs acuan tidak pernah terlihat. Karena itu:

- Tidak ada klaim tentang struktur menu, nama field, atau alur kerja panel aslinya.
- Kapabilitas yang mungkin sudah ada (mis. editor item) hanya bisa diasumsikan; desain ini **menggantikan**, bukan mereplikasi.
- Bila pemilik ingin paritas visual dengan panel lama, dibutuhkan tangkapan layar panel tersebut sebelum M4.
