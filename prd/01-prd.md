# PRD — Reditech Platform v1.0

| Field | Isi |
| --- | --- |
| Produk | Reditech Platform (rekonstruksi + perbaikan) |
| Versi dokumen | 1.1 |
| Tanggal | 28 Oktober 2026 |
| Pemilik produk | Pemilik Reditech.id |
| Domain | `https://www.reditech.id` |
| Status | Draft untuk persetujuan |
| Stack | Lihat [`00-tech-stack.md`](00-tech-stack.md) (frozen) |
| Basis bukti | Investigasi read-only papicode.id, 28 Oktober 2026 (di luar paket ini: `README.md`, `architecture.md`, `user-flows.md`) |

---

## 1. Latar belakang

Reditech menjual dan membagikan **source code siap pakai** untuk developer Indonesia. Modelnya dua jalur: gratis (lewat iklan) dan premium (berbayar, dengan riwayat dan unduh ulang). Platform dibangun dengan Next.js App Router di balik Cloudflare, pembayaran DOKU, dan distribusi berkas lewat Google Drive.

Investigasi read-only pada 28 Oktober 2026 memetakan 17 rute publik, 4 rute dashboard, 22 alur pengunjung, dan 14 alur pengguna terdaftar, dengan 4 area yang tetap tertutup (panel admin, invoice berisi, logout, alur pembayaran). Paket PRD ini mengisi area tertutup itu dengan desain baru yang eksplisit, bukan tebakan.

**Masalah yang diselesaikan:**

1. **Tidak ada spesifikasi.** Perilaku produk hanya hidup di kode dan di kepala pemilik. Setiap perubahan berisiko merusak alur yang sudah berjalan.
2. **Bug yang diketahui tidak tercatat.** Paginasi di luar rentang menampilkan "1177–69 dari 69" dan membalas `200`; dua kolom pencarian punya nama aksesibilitas identik; tidak ada CSP padahal memuat skrip iklan pihak ketiga.
3. **Area admin tidak terdokumentasi.** Tidak ada kontrak untuk menambah item, mengubah harga, atau memoderasi sponsor.
4. **Jalur gratis bergantung pada domain pihak ketiga** yang tidak diaudit dan membuka pop-under.

---

## 2. Tujuan dan metrik

### 2.1 Tujuan v1.0

| # | Tujuan | Ukuran keberhasilan |
| --- | --- | --- |
| G1 | Paritas fungsional dengan situs yang teramati | 100% baris `cukup` di matriks cakupan investigasi (di luar paket ini) punya acceptance test yang lulus |
| G2 | Pembelian premium berjalan end-to-end | ≥ 95% order PAID berakhir FULFILLED tanpa intervensi manual |
| G3 | Unduhan terkontrol | 0 tautan Drive yang bocor ke klien; 100% unduhan tercatat |
| G4 | Panel admin mandiri | Pemilik dapat menerbitkan item, mengubah harga, mengelola pesanan/sponsor/pengguna, dan mengubah pengaturan situs tanpa deploy |
| G5 | Kualitas dasar | LCP p75 < 2,5 s; CLS < 0,1; 0 pelanggaran axe serius pada 6 halaman utama |

### 2.2 Metrik produk (dipantau, bukan target keras)

- Tingkat penyelesaian unduhan gratis: mulai interstisial → token terbit.
- Rasio gratis→premium per item (`ordersItem / downloadsFree`).
- Waktu dari pembayaran terkonfirmasi sampai berkas terkirim (target p95 < 60 s).
- Tingkat penolakan unduhan karena entitlement hilang (indikator penyalahgunaan akun).

---

## 3. Persona

| Persona | Kebutuhan utama | Hambatan saat ini |
| --- | --- | --- |
| **Adi — mahasiswa** (pengunjung gratis) | Unduh cepat tanpa daftar untuk tugas | Harus melewati rantai iklan + pop-under; tidak tahu berkas sudah pernah diunduh |
| **Rina — freelancer** (pembeli premium) | Beli sekali, unduh ulang kapan saja, ada invoice | Tidak ada jejak unduhan gratis; tidak bisa ganti email; tidak ada invoice PDF |
| **Budi — pengusul** (request aplikasi) | Usul aplikasi, dapat kabar lewat email | Tidak ada status usulan; tidak ada notifikasi |
| **Sari — sponsor** | Bayar untuk tampil di papan sponsor | Tidak tahu urutan tampil; tidak ada bukti tayang |
| **Pemilik — superadmin** | Kelola katalog, harga, pesanan, sponsor | Tidak ada panel yang terdokumentasi (area tertutup) |

---

## 4. Ruang lingkup

### 4.1 Termasuk v1.0

**Publik**
- Beranda, katalog dengan pencarian/tipe/kategori/sort/paginasi (semua di server, state di URL).
- Detail item: galeri screenshot, sidebar unduhan, metadata, fitur, instalasi, share.
- Tutorial: indeks + artikel.
- Donasi/sponsor: input link + nominal + kategori papan.
- Request aplikasi: formulir + status via email.
- Jasa pembuatan website: halaman pemasaran + CTA WhatsApp.
- Kontak, kebijakan privasi, syarat & ketentuan.

**Unduhan**
- Jalur gratis: interstisial iklan milik sendiri → token → proxy Drive.
- Jalur premium: checkout DOKU → webhook → entitlement → token → proxy Drive.
- Pembelian "tanpa iklan" untuk item gratis (Rp 3.000) sebagai produk terpisah.

**Akun**
- Daftar/masuk lewat Google; masuk dengan kredensial untuk akun lama.
- Dashboard: ringkasan, source code saya, riwayat pembelian, riwayat unduhan, profil.
- Keluar dengan konfirmasi.

**Admin**
- CRUD item (draft → publish), kategori, teknologi, tutorial.
- Moderasi sponsor dan request aplikasi.
- Lihat pesanan, kirim ulang akses, cabut entitlement.
- Audit log setiap aksi admin.

### 4.2 Tidak termasuk v1.0 (non-goals)

- Aplikasi mobile native.
- Langganan/berlangganan bulanan.
- Multi-vendor / marketplace pihak ketiga.
- Multi-currency dan pembeli luar Indonesia.
- Rekomendasi berbasis ML, chatbot, atau fitur AI.
- Forum komunitas / komentar artikel.
- Refund otomatis (v1.0: refund manual oleh admin + catat di audit log).

### 4.3 Di luar keputusan otomatis (butuh persetujuan pemilik)

Lihat §10 Open Questions.

---

## 5. Peran dan izin

Model peran memakai **kapabilitas**, bukan nama peran. SUPERADMIN memegang seluruh kapabilitas tanpa kecuali; ADMIN hanya mendapat kapabilitas yang diberikan eksplisit. Rincian dan matriks per entitas: [`09-superadmin-admin.md`](09-superadmin-admin.md).

| Kemampuan | Anonim | USER | ADMIN (editor) | ADMIN (+publisher) | SUPERADMIN |
| --- | --- | --- | --- | --- | --- |
| Lihat katalog & detail | ✔ | ✔ | ✔ | ✔ | ✔ |
| Unduh gratis (lewat iklan) | ✔ | ✔ | ✔ | ✔ | ✔ |
| Beli item / tanpa-iklan | ✔ (guest checkout) | ✔ | ✔ | ✔ | ✔ |
| Dashboard pribadi | ✖ | ✔ | ✔ | ✔ | ✔ |
| Buat/ubah item (draft) | ✖ | ✖ | ✔ | ✔ | ✔ |
| Terbitkan item | ✖ | ✖ | ✖ | ✔ | ✔ |
| **Ubah harga item** | ✖ | ✖ | ✖ | ✖ | ✔ |
| Hapus item permanen | ✖ | ✖ | ✖ | ✖ | ✔ |
| Kategori & teknologi (CRUD) | ✖ | ✖ | C R U | C R U P | C R U P D |
| Tutorial (CRUD) | ✖ | ✖ | C R U | C R U P | C R U P D |
| Sponsor (moderasi) | ✖ | ✖ | baca | ✔ | ✔ |
| Request aplikasi | buat | buat | ubah status | ubah status | semua |
| Media (unggah/hapus) | ✖ | ✖ | unggah/ubah | unggah/ubah | semua |
| Lihat semua pesanan | ✖ | ✖ | ✔ | ✔ | ✔ |
| Refund pesanan | ✖ | ✖ | ✖ | ✖ | ✔ |
| Grant/revoke entitlement | ✖ | ✖ | ✖ | ✖ | ✔ |
| Kelola pengguna & peran | ✖ | ✖ | baca | baca | ✔ |
| Ubah pengaturan situs | ✖ | ✖ | baca | baca | ✔ |
| Audit log (baca / ekspor) | ✖ | ✖ | ✔ / ✖ | ✔ / ✖ | ✔ / ✔ |

Catatan: `ADMIN` tidak dapat mengubah perannya sendiri, tidak dapat menaikkan peran siapa pun, dan tidak dapat menurunkan SUPERADMIN aktif terakhir. Semua perubahan peran tercatat di audit log.

---

## 6. Epik fungsional

Rincian requirement dan acceptance criteria ada di [`02-requirements.md`](02-requirements.md).

| Epik | Nama | Ringkas |
| --- | --- | --- |
| E1 | Katalog & pencarian | Filter server-side, state di URL, paginasi terklip, empty state |
| E2 | Detail item | Galeri, metadata, fitur, instalasi, dua CTA unduhan |
| E3 | Unduhan gratis | Interstisial + countdown + token + proxy Drive |
| E4 | Checkout premium | Order → DOKU → webhook idempoten → entitlement |
| E5 | Akun & sesi | Google OAuth, kredensial lama, profil, ganti password kondisional |
| E6 | Dashboard | Ringkasan, item dimiliki, riwayat pembelian, riwayat unduhan |
| E7 | Tutorial | Indeks, artikel, tag, penulis |
| E8 | Sponsor & donasi | Papan sponsor, urutan per nominal, moderasi |
| E9 | Request aplikasi | Formulir, status, notifikasi email |
| E10 | Admin & superadmin | CRUD **seluruh** konten (item, kategori, teknologi, tutorial, sponsor, request, media), pesanan, entitlement, pengguna, pengaturan, audit; RBAC berbasis kapabilitas + MFA. Detail: [`09-superadmin-admin.md`](09-superadmin-admin.md) |
| E11 | Kepatuhan & keamanan | CSP, rate limit, robots, privasi, syarat |
| E12 | Instrumentasi | Analitik halaman, funnel unduhan, error tracking |

---

## 7. Kebutuhan non-fungsional (ringkas)

| ID | Kategori | Target |
| --- | --- | --- |
| NFR-01 | Performa | LCP p75 < 2,5 s pada 4G; HTML katalog < 300 KB uncompressed |
| NFR-02 | Performa | Respons server p95 < 500 ms untuk halaman katalog (origin) |
| NFR-03 | Ketersediaan | 99,5% bulanan; halaman statis tetap tersaji dari cache Cloudflare saat origin down |
| NFR-04 | Keamanan | CSP nonce, HSTS, `nosniff`, `SAMEORIGIN`, `Referrer-Policy`, rate limit endpoint unduhan |
| NFR-05 | Keamanan | Tidak ada data kartu di DB/log; hanya referensi transaksi DOKU |
| NFR-06 | Aksesibilitas | WCAG 2.2 AA pada halaman utama; navigasi keyboard penuh pada dropdown & drawer |
| NFR-07 | Privasi | Cookie sesi `httpOnly`; analitik tanpa PII; halaman kebijakan sesuai implementasi nyata |
| NFR-08 | Auditabilitas | Setiap aksi admin dan setiap unduhan tercatat dengan aktor + waktu |
| NFR-09 | Pemeliharaan | Cakupan tipe 100% pada modul domain; lint + typecheck wajib di CI |
| NFR-10 | SEO | `sitemap.xml` dinamis, `canonical` menormalkan urutan parameter, `robots.txt` menutup `/admin`, `/dashboard`, `/api` |

---

## 8. Batasan dan asumsi

**Batasan**
- Satu VPS, satu database, satu region (Indonesia/Singapura).
- Berkas di Google Drive, maksimum 200 MB per berkas.
- Harga dalam rupiah; pembeli domestik.
- Tim kecil (1–3 orang); tidak ada QA terpisah.

**Asumsi (harus diverifikasi sebelum M2)**
- A1 — DOKU menyediakan mode sandbox dengan QRIS simulasi.
- A2 — Pemilik memiliki akun Google Workspace / service account untuk Drive.
- A3 — AdSense menerima domain baru setelah verifikasi.
- A4 — Pemilik bersedia menanggung biaya VPS + R2 + DOKU per transaksi.

---

## 9. Risiko produk

| ID | Risiko | Dampak | Mitigasi |
| --- | --- | --- | --- |
| RP-01 | Drive menangguhkan service account | Semua unduhan mati | ADR-002; migrasi R2 < 1 hari |
| RP-02 | Webhook DOKU tidak masuk | Order tertahan PENDING | Cron rekonsiliasi tiap 10 menit + tombol "Cek status" di dashboard |
| RP-03 | Pembagian akun (satu beli, banyak unduh) | Kehilangan pendapatan | Batas 5 token/item/24 jam + log IP hash + alert |
| RP-04 | Konten ilegal pada sponsor | Risiko hukum | Moderasi wajib sebelum tayang; takedown tanpa refund (sesuai S&K) |
| RP-05 | Drive bukan CDN resmi | ToS | Batas ukuran + jalur migrasi |
| RP-06 | Teks kebijakan tidak cocok dengan implementasi | Risiko kepatuhan | Kebijakan ditulis ulang saat M5 berdasarkan perilaku nyata |

---

## 10. Open questions (butuh keputusan pemilik)

| ID | Pertanyaan | Default bila tidak dijawab |
| --- | --- | --- |
| Q1 | Riwayat unduhan gratis ditampilkan ke pengguna, atau hanya untuk statistik? | Ditampilkan (ADR-008) |
| Q2 | Harga "tanpa iklan" tetap Rp 3.000 untuk semua item gratis? | Ya, dari `Setting.noAdsPriceIdr` |
| Q3 | Invoice PDF dibuat sendiri atau cukup halaman HTML yang bisa dicetak? | HTML + `window.print()` di v1.0 |
| Q4 | Apakah guest checkout diizinkan untuk pembelian premium? | Ya (lebih rendah friksi), akun dibuat otomatis dari email |
| Q5 | Kebijakan refund: otomatis atau manual? | Manual oleh admin + audit log |
| Q6 | Apakah akun kredensial lokal masih perlu didukung? | Ya, hanya untuk login akun lama; tidak ada registrasi baru |
| Q7 | Sponsor ditayangkan otomatis setelah pembayaran atau setelah moderasi? | Setelah moderasi (RP-04) |
| Q8 | Analitik: GA4, Plausible, atau Cloudflare Analytics saja? | Cloudflare Analytics + event server-side ke tabel sendiri |
| Q9 | Apakah akan ada akun `ADMIN` selain SUPERADMIN di v1.0? | Tidak. Kapabilitas ADMIN sudah diimplementasikan tetapi hanya satu akun SUPERADMIN yang aktif sampai ada editor |
| Q10 | Apakah panel admin perlu paritas visual dengan panel lama? | Tidak. Panel baru mengikuti tema Celestial (`design.md`); paritas visual butuh tangkapan layar panel lama lebih dulu |
| Q11 | Batas unduhan premium per pengguna per item? | 5 token / 24 jam / item |

---

## 11. Tabel paritas: perilaku asli vs keputusan v1.0

Ini bagian terpenting PRD. Setiap baris adalah keputusan sadar, bukan kelalaian.

| # | Perilaku teramati | Keputusan v1.0 | Alasan |
| --- | --- | --- | --- |
| 1 | `?page=99` → `200`, "Menampilkan 1177–69 dari 69" | **Diperbaiki**: `308` ke halaman terakhir | ADR-005 |
| 2 | Tidak ada CSP | **Diperbaiki**: CSP nonce | ADR-007 |
| 3 | Dua searchbox, nama aksesibilitas identik | **Diperbaiki**: label berbeda (`Cari di header`, `Cari di katalog`) | NFR-06 |
| 4 | Paginasi tanpa `aria-current` | **Diperbaiki**: `aria-current="page"` | NFR-06 |
| 5 | Dropdown `Layanan` tidak bisa dibuka lewat klik (otomasi) | **Diperbaiki**: buka lewat klik **dan** hover, tutup dengan Escape, fokus terkelola | NFR-06 |
| 6 | Rantai shortlink iklan pihak ketiga + pop-under | **Diganti**: interstisial milik sendiri | ADR-006 |
| 7 | Unduhan gratis tidak tercatat di dashboard | **Diperbaiki**: riwayat unduhan terpisah | ADR-008 |
| 8 | Kebijakan menyebut registrasi password, UI hanya Google | **Diselaraskan**: hanya Google untuk akun baru; teks kebijakan diperbarui | RP-06 |
| 9 | Logout tanpa konfirmasi | **Diperbaiki**: dialog konfirmasi | UX |
| 10 | `theme_color` manifest `#b6cbab` ≠ token `#1f5139` | **Diganti**: manifest memakai `#58d3db` (aqua Celestial) | Identitas baru, ADR-012 |
| 11 | Email profil `disabled` | **Dipertahankan** | Identitas akun = email OAuth |
| 12 | Ganti password hanya untuk akun lokal | **Dipertahankan** | Perilaku sudah benar |
| 13 | Filter state murni di URL | **Dipertahankan** | ADR-004 |
| 14 | Token warna & tipografi hijau/terakota + Plus Jakarta Sans | **Diganti** ke tema Celestial: aqua `#58d3db`/hitam, Open Sans + Georgia + Menlo, radius 8px | Rebrand Reditech (ADR-012); paritas berlaku fungsional, bukan visual |
| 15 | Thumbnail WebP + lazy + preload hero | **Dipertahankan** | Performa |
| 16 | `/admin` hanya tertutup `robots.txt` | **Diperbaiki**: middleware RBAC + MFA untuk SUPERADMIN | Keamanan |
| 17 | Item gratis punya CTA "tanpa iklan Rp 3.000" | **Dipertahankan** | Model bisnis nyata |
| 18 | Slug `<judul>-<8-9 karakter acak>` | **Dipertahankan** untuk item baru | Paritas URL |
| 19 | `sitemap.xml` tanpa `lastmod` | **Diperbaiki**: `lastmod` per item/tutorial | SEO |
| 20 | Footer copyright tahun dinamis | **Dipertahankan** | Sudah benar |

---

## 12. Rencana rilis

| Rilis | Isi | Gate |
| --- | --- | --- |
| **v0.9 (internal)** | E1, E2, E3, E7, **E10-inti** (item + kategori + teknologi + media + publikasi), E11 | Katalog + unduhan gratis berjalan di staging; konten dikelola dari panel, bukan seed |
| **v1.0** | + E4, E5, E6, E12 | Satu pembelian nyata berhasil end-to-end |
| **v1.1** | + E10-lengkap (pesanan, entitlement, pengguna, pengaturan, audit, antrean approval), E8, E9 | Pemilik bisa mengelola seluruh siklus konten dan transaksi tanpa deploy |
| **v1.2** | Hardening: MFA wajib, step-up re-auth, invoice PDF, rate limit lanjutan | Uji beban + uji restore lulus |

Catatan: **E10-inti masuk v0.9**, bukan v1.1, karena tanpa panel tidak ada cara menerbitkan item selain menulis SQL. Panel superadmin adalah prasyarat operasional, bukan fitur tambahan.

Detail milestone, estimasi, dan definition of done: [`06-milestones.md`](06-milestones.md).

---

## 13. Definisi "selesai" untuk PRD ini

PRD dianggap selesai dan dapat dieksekusi bila:
1. §10 tidak menyisakan pertanyaan bertanda wajib.
2. Setiap epik punya minimal satu requirement ber-ID di [`02-requirements.md`](02-requirements.md).
3. Skema data di [`03-data-model.md`](03-data-model.md) mencakup semua entitas yang disebut di §6.
4. Setiap endpoint di [`04-api-spec.md`](04-api-spec.md) punya pemilik requirement.
5. Tabel paritas §11 disetujui pemilik.
6. Setiap entitas di §6 punya operasi CRUD + aturan publikasi yang tertulis di [`09-superadmin-admin.md`](09-superadmin-admin.md), termasuk siapa yang boleh melakukannya.
