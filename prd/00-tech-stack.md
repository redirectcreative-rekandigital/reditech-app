# Tech Stack — Keputusan Final (v1.0)

Produk: **Reditech** — domain produksi `https://www.reditech.id`.
Status: **FROZEN** untuk v1.0. Perubahan setelah dokumen ini disetujui harus lewat ADR baru di §5.
Tanggal keputusan: 28 Oktober 2026.
Rujukan bukti: dokumen investigasi papicode.id yang tidak disertakan dalam paket ini (`architecture.md`, `design-system.md` — perilaku & palet acuan lama), [`design.md`](design.md) (identitas visual Reditech).

---

## 1. Ringkasan stack

| Layer | Pilihan | Versi / Catatan |
| --- | --- | --- |
| Bahasa | TypeScript | `strict: true`, `noUncheckedIndexedAccess: true` |
| Framework | **Next.js App Router** | SSR/RSC; versi stabil terbaru saat M0 dimulai |
| UI | React + **Tailwind CSS** | Token dari `design.md` (tema Celestial), tanpa palet tambahan |
| UI kit | **shadcn/ui (komplit)** | 45 primitif (`components/ui/*`), gaya `new-york`, CSS variables |
| Ikon | `lucide-react` | Paritas dengan situs asli (`lucide-chevron-down`, `lucide-search-x`) |
| Font | `next/font/google` + font sistem | Open Sans (UI), Georgia (bacaan), Menlo (kode); di-self-host saat build |
| Form & validasi | React Hook Form + **Zod** | Satu skema Zod dipakai di klien dan server action |
| Database | **PostgreSQL 16** | `pg_trgm` untuk pencarian |
| ORM | **Prisma** | `prisma migrate deploy` di pipeline rilis |
| Cache & rate limit | **Redis 7** | Rate limit, idempotency webhook, cache counter unduhan |
| Auth | **Auth.js (NextAuth)** | Provider: Google OAuth + Credentials (akun lama) |
| Sesi | Database strategy + cookie `httpOnly` | `secure`, `sameSite=lax`, umur 30 hari |
| Pembayaran | **DOKU Checkout (hosted)** | QRIS, VA, e-wallet |
| Berkas source code | **Google Drive (service account)** | Dialirkan lewat proxy server; tautan tidak pernah diekspos |
| Gambar (thumbnail/screenshot) | **Cloudflare R2** | Publik baca, cache immutable di edge |
| CDN / WAF / DNS | **Cloudflare** | HTTP/3, WAF terkelola, cache rules per path |
| Origin | **VPS + Docker Compose** | App, Postgres, Redis, reverse proxy, cron |
| Reverse proxy | Caddy (TLS otomatis) atau Nginx | TLS origin wajib, `Full (strict)` di Cloudflare |
| Email transaksional | SMTP relay / Resend | Undangan admin, invoice, notifikasi request |
| Observabilitas | Sentry + log JSON ke stdout + uptime eksternal | Tanpa APM berbayar di v1.0 |
| CI/CD | GitHub Actions → GHCR → deploy SSH | Migrasi DB dijalankan sebelum swap container |
| Otorisasi | **RBAC berbasis kapabilitas** | `can(actor, capability)`; SUPERADMIN melewati semua pemeriksaan |
| MFA admin | **TOTP** (`otplib`) | Wajib untuk `ADMIN`/`SUPERADMIN`; step-up untuk aksi sensitif |

---

## 2. Alasan pemilihan (ringkas)

**Next.js App Router** — bukan preferensi, melainkan konsekuensi paritas. Perilaku yang harus direproduksi (filter katalog dirender server, prefetch RSC, `?_rsc=` pada navigasi, HTML tanpa cache edge) adalah perilaku bawaan App Router. Framework lain memaksa implementasi manual untuk hasil yang sama.

**PostgreSQL + Prisma** — relasi katalog (`Item ↔ Category ↔ Technology ↔ Feature`) rapi di SQL, transaksi checkout butuh `SERIALIZABLE`/`SELECT ... FOR UPDATE` untuk mencegah double-grant entitlement, dan `pg_trgm` cukup untuk pencarian sampai ~50 ribu item. Prisma dipilih karena migrasi terverifikasi dan tipe hasil query dipakai langsung di RSC.

**Auth.js** — kebutuhan: Google OAuth untuk akun baru, kredensial untuk akun lama, sesi berbasis cookie. Ini persis kombinasi yang didukung Auth.js tanpa kode kustom untuk alur OAuth.

**DOKU saja** — satu gateway berarti satu kontrak webhook, satu state machine, satu rekonsiliasi. Abstraksi `PaymentProvider` tetap dibuat agar gateway kedua tidak memerlukan perubahan domain.

**VPS + Docker** — pemilik menyatakan "database, login, dan file di server milik sendiri"; VPS menjaga klaim itu tetap benar dan memberi kontrol atas Postgres, cron, serta biaya tetap.

**Redis** — dibutuhkan untuk rate limit unduhan (`/api/download` adalah endpoint paling disalahgunakan), idempotency key webhook, dan counter unduhan yang tidak boleh memukul Postgres tiap request.

---

## 3. ADR

### ADR-001 — Google Drive sebagai storage berkas, di balik proxy

**Konteks.** Pemilik memilih Google Drive untuk jalur gratis maupun premium (paritas dengan situs asli).

**Keputusan.**
1. Berkas disimpan di Drive, dalam folder per item: `/<item-slug>/<file>.zip`.
2. Folder **tidak** dibagikan publik. Akses hanya lewat service account dengan scope `drive.readonly`.
3. Browser **tidak pernah** menerima `drive.google.com/...`. Semua unduhan melewati `GET /api/download/file/[token]` yang mengalirkan byte dari Drive API (`files.get` + `alt=media`).
4. Token unduh berumur **5 menit**, sekali pakai, terikat `userId` (premium) atau `downloadSessionId` (gratis).
5. Semua akses dicatat di tabel `Download`.

**Konsekuensi.**
- (+) Lisensi masih bisa ditegakkan: entitlement dicabut → tautan mati. Unduhan teraudit per pengguna.
- (+) Tidak ada tautan Drive yang bisa diteruskan ke orang lain.
- (−) Bandwidth keluar melewati VPS. Ukuran ZIP dibatasi **200 MB**; di atas itu wajib pindah storage (lihat ADR-002).
- (−) Drive API tidak mendukung HTTP `Range` untuk `alt=media`; unduhan **tidak bisa di-resume**. UI harus menampilkan peringatan untuk berkas > 50 MB.
- (−) Rate limit Drive API per service account (kuota per menit) → perlu antrean/retry dengan backoff.
- (−) **Risiko ToS**: Drive bukan CDN untuk distribusi produk berbayar. Ini diterima secara sadar; jalur migrasi disiapkan.

**Mitigasi.** Semua akses berkas lewat antarmuka `StorageProvider` (ADR-002). Migrasi ke R2/S3 = ganti implementasi + jalankan skrip salin, tanpa menyentuh domain.

### ADR-002 — Abstraksi `StorageProvider`

```ts
export interface StorageProvider {
  /** Mengembalikan stream berkas + metadata untuk di-proxy ke klien. */
  openRead(fileRef: string): Promise<{
    stream: ReadableStream<Uint8Array>
    size: number | null
    filename: string
    contentType: string
  }>
  /** true bila provider mendukung resume/partial content. */
  readonly supportsRange: boolean
}
```

Implementasi v1.0: `GoogleDriveStorageProvider`. Implementasi cadangan: `S3StorageProvider` (R2/S3, mendukung `Range`). Domain hanya mengenal `store.openRead(ref)`.

### ADR-003 — Harga disimpan sebagai integer rupiah

**Konteks.** UI menampilkan `Rp 3.000` dengan total `Rp 3.021`, menandakan ada biaya layanan.

**Keputusan.** Semua nominal `Int` dalam rupiah penuh. Order menyimpan `subtotalIdr`, `serviceFeeIdr`, `totalIdr`, dan **snapshot** harga per baris. Harga item dibaca ulang dari DB saat membuat order — nominal dari klien selalu diabaikan.

**Konsekuensi.** Tidak ada galat pembulatan floating point. Perubahan harga item tidak mengubah invoice lama.

### ADR-004 — Filter katalog sepenuhnya di URL, dirender server

**Keputusan.** `search`, `type`, `kategori`, `sort`, `page` adalah sumber kebenaran state; tidak ada state filter di React (tanpa Zustand/Redux). Setiap perubahan = navigasi RSC.

**Konsekuensi.** State bisa dibagikan lewat tautan, prerender/prefetch bekerja, dan tidak ada flash konten salah.

### ADR-005 — Perbaikan perilaku paginasi di luar rentang

**Konteks.** Situs asli membalas `200` untuk `?page=99` dengan teks "Menampilkan 1177–69 dari 69".

**Keputusan.** `page > totalPages` → **`308` permanen ke halaman terakhir** dengan parameter lain dipertahankan; `page < 1` atau bukan angka → `308` ke `page=1`. Tidak ada halaman kosong berisi rentang terbalik.

**Konsekuensi.** Perbaikan disengaja, menyimpang dari paritas. Dicatat di [`01-prd.md`](01-prd.md) §11 tabel paritas.

### ADR-006 — Interstisial iklan milik sendiri, tanpa rantai shortlink

**Konteks.** Situs asli mengirim pengguna gratis ke `sfl.gl → zz.tolaneration.com → pb.pawawaugend.qpon → app.khaddavi.net → uo.assessschisma.com`.

**Keputusan.** Jalur gratis tetap "lewat iklan", tetapi halaman interstisial dirender sendiri di `/download/[slug]/ads` (hitung mundur 10 detik, satu slot AdSense, tombol lanjut). **Tidak ada redirect ke domain pihak ketiga.**

**Konsekuensi.** (+) Domain Reditech tidak lagi meneruskan pengguna ke jaringan iklan yang tidak diaudit, dan tidak ada pop-under. (+) Pendapatan iklan tetap. (−) Pendapatan per unduhan lebih rendah dibanding shortlink berbayar; ini keputusan sadar (risiko reputasi/keamanan).

### ADR-007 — CSP ketat; nonce ditolak karena Cache Components

**Status.** Diamandemen di M0. Keputusan awal (nonce per request, tanpa `unsafe-inline`) tidak dapat dijalankan pada Next.js 16 + `cacheComponents: true`.

**Konteks.** Nonce hanya bisa disuntikkan ke HTML yang dirender per request. Cache Components selalu mem-prerender **shell statis** (PPR), termasuk untuk `/admin`; skrip di shell itu dibekukan saat build. Dengan `'strict-dynamic'`, skrip tanpa nonce diblokir — verifikasi build menunjukkan hanya 6 dari 19 `<script>` pada `/admin` yang mendapat nonce.

**Keputusan.** Satu CSP tanpa nonce untuk semua rute: `script-src 'self' 'unsafe-inline'` (`'unsafe-eval'` hanya di pengembangan), `style-src 'self' 'unsafe-inline'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, `upgrade-insecure-requests`. Rincian: `12-route-map.md` 12.1.

**Konsekuensi.** (−) `'unsafe-inline'` melemahkan pertahanan XSS pada skrip; diterima karena tidak ada UGC yang dirender sebagai HTML. (+) ISR/PPR tetap hidup sehingga TTFB katalog tidak dikorbankan. (→) Nonce dihidupkan lagi hanya bila UGC HTML masuk atau shell statis dihapus dari Cache Components; rute terkait harus dinamis penuh dan CSP-nya dipisah. Alternatif "paksa seluruh aplikasi dinamis" ditolak karena membatalkan ISR.

### ADR-008 — Riwayat unduhan gratis dicatat

**Konteks.** Pengguna melaporkan unduhan gratis tidak muncul di dashboard.

**Keputusan.** Tabel `Download` mencatat **semua** unduhan (gratis dan premium). Dashboard menampilkan "Riwayat Unduhan" terpisah dari "Riwayat Pembelian".

**Konsekuensi.** Menyimpang dari paritas, tetapi menjawab keluhan nyata. Untuk pengguna anonim, riwayat disimpan per `downloadSessionId` (cookie) dan tidak ditampilkan di UI — hanya untuk statistik.

---

### ADR-009 — Otorisasi berbasis kapabilitas, bukan nama peran

**Konteks.** Situs asli hanya menutup `/admin` lewat `robots.txt`; tidak ada bukti adanya lapis otorisasi. Panel admin harus dirancang dari nol, dan pemilik meminta **seluruh CRUD konten diatur superadmin**.

**Keputusan.**
1. Empat peran tersimpan: `VISITOR` (implisit), `USER`, `ADMIN`, `SUPERADMIN`.
2. `ADMIN` menyimpan **daftar kapabilitas eksplisit** (`User.permissions String[]`), bukan peran turunan.
3. Pemeriksaan tunggal: `can(actor, capability)`. Bila `role === 'SUPERADMIN'` → selalu `true`.
4. Tidak ada kode fitur yang memeriksa nama peran. Menambah peran baru = menambah bundel kapabilitas, tanpa menyentuh fitur.
5. MFA (TOTP) wajib untuk `ADMIN`/`SUPERADMIN`; aksi sensitif memakai **step-up** (TOTP ulang bila sesi > 15 menit).
6. Setiap aksi tulis admin menulis `AdminAuditLog` dengan diff `before`/`after` dalam transaksi yang sama.

**Konsekuensi.**
- (+) Auditable: satu daftar kapabilitas menjelaskan siapa boleh apa.
- (+) Tidak ada eskalasi lewat "peran kebetulan"; menambah fitur baru menuntut kapabilitas baru yang eksplisit.
- (−) Lebih banyak kode boilerplate di setiap server action (`requirePermission(...)`), dan itu disengaja: lapis kedua setelah middleware.
- (−) MFA menambah friksi login pemilik; dimitigasi dengan "ingat perangkat 30 hari".

**Alternatif yang ditolak.** RBAC berbasis peran tetap (role → izin hardcoded) karena menambah peran baru berarti mengubah kode di banyak tempat. ABAC/policy engine (Casbin, OPA) terlalu berat untuk 4 peran.

### ADR-010 — Panel admin adalah prasyarat rilis, bukan fitur lanjutan

**Konteks.** Tanpa panel, satu-satunya cara menerbitkan item adalah SQL manual — tidak dapat diterima untuk operasi harian.

**Keputusan.** CRUD inti (item, kategori, teknologi, media, publikasi) masuk **v0.9**, bersama katalog publik. Fitur admin lanjutan (pesanan, entitlement, pengguna, pengaturan, audit) masuk v1.1.

**Konsekuensi.** Estimasi v0.9 naik ±1 minggu; sebagai gantinya tidak ada jendela waktu di mana konten hanya bisa diubah lewat database.

---

### ADR-011 — shadcn/ui komplit sebagai lapisan UI

**Konteks.** Ada 29 layar publik/dashboard dan 14 layar admin. Membangun primitif sendiri (dialog, combobox, tabel, sidebar) berarti menulis ulang perilaku aksesibilitas yang sudah benar di Radix, dan menambah ±15 hari kerja tanpa nilai produk.

**Keputusan.**
1. Semua primitif dari **shadcn/ui** (45 komponen, CLI `shadcn`), gaya `new-york`, `baseColor: neutral`, CSS variables.
2. Komponen buatan sendiri **hanya** di lapisan domain (55 komponen) dan 6 wrapper tipis; tidak ada `Dialog.tsx`/`Select.tsx` sendiri.
3. Token shadcn diisi nilai tema **Celestial** dari `design.md` — **tanpa warna tambahan**. Slot yang tidak didefinisikan di `design.md` (`--destructive-foreground`) memakai nilai token yang sudah ada (hitam, 5,10:1 di atas merah); batas kontrol memakai turunan `color-mix` (`--border-strong`). Kontras yang gagal AA ditangani lewat pemilihan pasangan token dan bentuk komponen, bukan warna baru.
4. Tidak memakai Storybook; pratinjau lewat rute `/dev/components` yang non-aktif di produksi.
5. Token `.dark` didefinisikan dari `design.md`, tetapi toggle tema belum dikirim di v1.0.

**Konsekuensi.**
- (+) Aksesibilitas keyboard/focus trap/ARIA diwarisi, bukan ditulis ulang.
- (+) 55 komponen domain menjadi satu-satunya permukaan desain yang perlu dirawat.
- (+) `components/ui/*` dapat diperbarui dari upstream tanpa merge manual yang berat.
- (−) Istilah `--muted` berbeda antar dokumen: di `design-system.md` (bukti lama) berarti **teks**, di shadcn/Celestial berarti **latar**. Mitigasi: peta eksplisit di `10-design-tokens.md` §3 dan larangan memakai `--muted` untuk teks.
- (−) Ketergantungan pada struktur DOM Radix; styling yang menyimpang jauh butuh `className` panjang, bukan komponen baru.

**Alternatif ditolak.** Design system internal dari nol (biaya a11y terlalu besar), MUI/Chakra (tidak cocok dengan Tailwind + token acuan), Radix polos (shadcn sudah membungkusnya dengan API yang konsisten).

---

### ADR-012 — Identitas visual Reditech memakai tema Celestial

**Konteks.** Rebrand Papicode → Reditech butuh identitas visual sendiri. Palet acuan (hijau botol `#1f5139` + terakota `#c8634a`) adalah milik situs lama dan tidak boleh dipakai untuk brand baru. Pemilik menyerahkan `design.md` (tema Celestial, tweakcn) sebagai sumber warna, tipografi, radius, dan spasi.

**Keputusan.**
1. Palet, tipografi, radius (8px), dan skala spasi (8px) diambil **seluruhnya** dari `design.md`; tidak ada token warna lain.
2. Paritas dengan situs lama berlaku pada **fungsi, alur, URL, dan konten** — bukan pada warna/font. Ini deviasi visual yang disengaja.
3. Aturan yang mengikat dari `design.md`: hitam di atas aqua (bukan putih), satu aksi primary per layar, aqua tidak untuk latar besar, Georgia hanya untuk bacaan panjang.
4. Dua nilai turunan ditambahkan karena `design.md` tidak mencakupnya: `--destructive-foreground` (hitam, 5,10:1) dan `--border-strong` (3,4:1 untuk batas kontrol). Keduanya dihitung dari token yang ada, bukan warna baru.

**Konsekuensi.**
- (+) Satu sumber kebenaran visual yang bisa dipasang langsung sebagai tema shadcn.
- (+) Kontras hampir seluruh pasangan ≥ 10:1; jauh lebih aman daripada palet lama.
- (−) Aqua `#58d3db` hanya 1,79:1 di atas putih, sehingga **tidak boleh** menjadi warna teks atau indikator fokus tunggal.
- (−) Putih di atas merah gagal (4,11:1); tombol destruktif wajib berlabel hitam, yang secara visual tidak lazim dan perlu dijelaskan di UI.
- (−) Tidak ada warna status hijau/kuning; `success`/`warning` dibedakan ikon + kata.

**Alternatif ditolak.** Mempertahankan palet acuan (bertentangan dengan rebrand), memakai coral sebagai aksen kedua (menambah warna di luar `design.md`), mode gelap penuh di v1 (menambah lingkup tanpa kebutuhan).

---

## 4. Yang sengaja tidak dipakai

| Ditolak | Alasan |
| --- | --- |
| Elasticsearch / Meilisearch | `pg_trgm` + `tsvector` cukup sampai puluhan ribu item |
| GraphQL | Tidak ada konsumen ketiga; RSC + server action lebih sederhana |
| Microservices | Satu domain, satu tim, satu database — distribusi hanya menambah latensi |
| Kafka / queue berat | BullMQ di atas Redis cukup untuk email & retry Drive API |
| Multi-currency | Harga dalam rupiah, pembeli di Indonesia |
| Rantai shortlink iklan | Lihat ADR-006 |

---

## 5. Proses perubahan stack

Setiap perubahan pada tabel §1 wajib menambah ADR baru di dokumen ini dengan format: Konteks → Keputusan → Konsekuensi → Alternatif yang ditolak. Perubahan tanpa ADR dianggap utang teknis dan dicatat di backlog.

---

## 6. Risiko stack

| ID | Risiko | Dampak | Mitigasi |
| --- | --- | --- | --- |
| RS-01 | Kuota/ToS Google Drive untuk distribusi berbayar | Unduhan gagal massal; akun service ditangguhkan | Batas 200 MB/berkas, monitoring error Drive, ADR-002 untuk pindah R2 dalam < 1 hari kerja |
| RS-02 | Tidak ada `Range` di proxy Drive | Unduhan besar gagal di jaringan buruk | Peringatan UI + tombol ulang; batas ukuran |
| RS-03 | Single VPS = single point of failure | Situs mati saat VPS down | Snapshot harian, `docker compose up` di VPS cadangan, RTO 4 jam |
| RS-04 | Postgres self-host tanpa PITR | Kehilangan data transaksi | `pg_dump` harian + WAL archive ke R2, uji restore bulanan |
| RS-05 | AdSense + CSP saling bertentangan | Iklan tidak tampil | Nonce + domain allowlist; uji di staging dengan akun AdSense uji |
