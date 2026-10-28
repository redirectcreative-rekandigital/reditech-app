# Requirements — Fungsional & Non-Fungsional

Semua requirement di sini dapat dilacak ke satu epik di [`01-prd.md`](01-prd.md) §6 dan satu acceptance test di [`07-test-plan.md`](07-test-plan.md).
Prioritas: **M** = Must (v1.0), **S** = Should (v1.1), **C** = Could (v1.2), **W** = Won't (bukan v1.x).

---

## 1. Katalog (E1)

| ID | Requirement | Prioritas | Acceptance criteria ringkas |
| --- | --- | --- | --- |
| FR-CAT-01 | Katalog menampilkan 12 item per halaman, dirender server | M | HTML awal memuat 12 kartu; tanpa JS tetap lengkap |
| FR-CAT-02 | Teks jumlah berbentuk "Menampilkan A–B dari N source code", ditambah "untuk “kata”" bila ada pencarian | M | Angka cocok dengan query; A/B/N dalam `<strong>` |
| FR-CAT-03 | Pencarian lewat parameter `search`, dua input (header & konten) dengan label aksesibilitas **berbeda** | M | `Cari di header` / `Cari di katalog`; keduanya mengisi `value` dari URL |
| FR-CAT-04 | Filter tipe: `Semua` / `Gratis` / `Premium` via `type=FREE\|PREMIUM` | M | Radio checked sesuai URL; tanpa `type` → `Semua` |
| FR-CAT-05 | Filter kategori via `kategori=<slug>`, 11 chip | M | Satu chip aktif; `Semua kategori` menghapus parameter |
| FR-CAT-06 | Urutan `newest` (default, tanpa parameter) / `popular` / `oldest` | M | Tiga urutan menghasilkan tiga urutan HTML berbeda dan deterministik |
| FR-CAT-07 | Paginasi `page`, halaman 1 tanpa parameter, `aria-current="page"` | M | Tautan mempertahankan `search/type/kategori/sort` |
| FR-CAT-08 | Halaman di luar rentang dialihkan `308` ke halaman terakhir | M | `?page=99` → `308` ke `?page=N`; tidak ada teks "1177–69" |
| FR-CAT-09 | `page` tidak valid (< 1, bukan angka) → `308` ke `page=1` | M | Tidak ada 500; parameter lain dipertahankan |
| FR-CAT-10 | Empty state 0 hasil: "Tidak ada source code yang cocok." + saran + `Hapus pencarian` | M | `aria-live="polite"`; tanpa paginasi |
| FR-CAT-11 | State katalog 100% di URL; tidak ada state filter di klien | M | Muat ulang browser → tampilan identik |
| FR-CAT-12 | `canonical` menormalkan urutan parameter (urut abjad kunci) | S | Dua URL dengan parameter sama berbeda urutan → satu canonical |
| FR-CAT-13 | Kartu sponsor disisipkan di grid, berlabel jelas | S | Label "Dukung Reditech" terlihat; tidak menyamar sebagai item |
| FR-CAT-14 | Pencarian tahan salah ketik ringan (trigram) | C | "kasirr" tetap menemukan item "kasir" |

## 2. Detail item (E2)

| ID | Requirement | Prioritas | Acceptance criteria |
| --- | --- | --- | --- |
| FR-ITEM-01 | Halaman detail memuat galeri (1–8 screenshot), navigasi prev/next, perbesar | M | Keyboard navigable; `alt` deskriptif |
| FR-ITEM-02 | Sidebar unduhan: harga/tipe, metadata (`Teknologi`, `Lisensi`, `Download`, `Rilis`) | M | `<dl>` semantik |
| FR-ITEM-03 | Navigasi isi: Deskripsi, Cara kerja, Fitur (n), Instalasi | M | Anchor berfungsi; heading hierarkis |
| FR-ITEM-04 | Fitur bernomor dan langkah instalasi berurutan | M | Urutan sesuai data, bukan urutan sisip |
| FR-ITEM-05 | Tombol bagikan (WhatsApp) + `Salin link` | S | Salin memberi umpan balik visual |
| FR-ITEM-06 | Item gratis menampilkan dua CTA: berbayar "tanpa iklan" dan gratis "lewat iklan" | M | Keduanya terlihat; berbayar memakai `primary` (aqua, satu-satunya di layar), gratis memakai `outline` + tautan |
| FR-ITEM-07 | Item premium menampilkan `Beli Source Code`, `Lihat demo` (bila ada), tanpa CTA gratis | M | Tidak ada tautan unduhan gratis untuk premium |
| FR-ITEM-08 | Item `ARCHIVED` → 410 dengan tautan ke katalog | M | Bukan 404 polos |
| FR-ITEM-09 | Pratinjau sosial (OG image) per item | S | Judul + thumbnail, bukan gambar default |

## 3. Unduhan (E3)

| ID | Requirement | Prioritas | Acceptance criteria |
| --- | --- | --- | --- |
| FR-DL-01 | Unduhan gratis tidak memerlukan akun | M | Alur selesai tanpa login |
| FR-DL-02 | Jalur gratis melewati interstisial milik sendiri `/download/[slug]/ads` dengan hitung mundur | M | Tidak ada redirect ke domain pihak ketiga |
| FR-DL-03 | Hitung mundur dapat dilewati tanpa melanggar aturan iklan; tombol aktif setelah selesai | M | Timer 10 detik (dapat dikonfigurasi) |
| FR-DL-04 | Setelah interstisial, server menerbitkan `DownloadToken` berumur 5 menit, sekali pakai | M | Token kedaluwarsa → 410 dengan tautan ulang |
| FR-DL-05 | Berkas dialirkan lewat `GET /api/download/file/[token]`, bukan tautan Drive | M | Respons tidak memuat `drive.google.com` |
| FR-DL-06 | Batas 5 unduhan/item/24 jam per pengguna atau sesi | M | Kelebihan → 429 dengan waktu tunggu |
| FR-DL-07 | Setiap unduhan (berhasil/gagal) tercatat di `Download` | M | Ada `purpose`, `result`, `ipHash`, `uaHash` |
| FR-DL-08 | Item premium: token hanya terbit bila ada `Entitlement` aktif | M | Tanpa entitlement → 403 dengan CTA beli |
| FR-DL-09 | Berkas > 50 MB menampilkan peringatan "tidak dapat dilanjutkan" | M | Peringatan tampil sebelum mulai |
| FR-DL-10 | Berkas > 200 MB ditolak saat unggah/publikasi | M | Pesan jelas ke admin |
| FR-DL-11 | Unduhan ulang dari dashboard memakai mekanisme token yang sama | M | Satu jalur kode, bukan dua |

## 4. Pembayaran (E4)

| ID | Requirement | Prioritas | Acceptance criteria |
| --- | --- | --- | --- |
| FR-PAY-01 | Checkout membuat `Order` + invoice DOKU, lalu mengalihkan ke halaman pembayaran | M | Nominal dihitung ulang di server; klien tidak mengirim harga |
| FR-PAY-02 | Order menyimpan snapshot harga per baris (`OrderItem.priceIdr`) | M | Perubahan harga item tidak mengubah order lama |
| FR-PAY-03 | Biaya layanan tampil terpisah (contoh Rp 3.000 + Rp 21 = Rp 3.021) | M | Dua baris nominal di halaman pembayaran |
| FR-PAY-04 | Webhook `POST /api/webhooks/doku` memverifikasi signature + idempoten per `eventId` | M | Kiriman ganda tidak menggandakan entitlement |
| FR-PAY-05 | Transisi status: `PENDING → PAID → FULFILLED`, juga `EXPIRED` / `FAILED` / `REFUNDED` | M | Tidak ada transisi mundur dari `FULFILLED` |
| FR-PAY-06 | Order kedaluwarsa otomatis setelah 24 jam (cron) | M | Status `EXPIRED`; tautan pembayaran mati |
| FR-PAY-07 | Rekonsiliasi berkala: order `PENDING` > 10 menit dicek ulang ke DOKU | M | Log hasil; tidak mengubah order final |
| FR-PAY-08 | Guest checkout diizinkan; akun dibuat dari email pembeli | S | Email verifikasi terkirim; klaim akun saat login |
| FR-PAY-09 | Halaman invoice dapat dicetak (print CSS) | M | Tombol `Cetak` menghasilkan layout A4 rapi |
| FR-PAY-10 | Refund hanya manual oleh SUPERADMIN dengan alasan | M | Entitlement dicabut; status `REFUNDED`; audit tercatat |
| FR-PAY-11 | Tombol `Cek status` di halaman pesanan pengguna | S | Memicu query ulang ke gateway |

## 5. Akun & sesi (E5)

| ID | Requirement | Prioritas | Acceptance criteria |
| --- | --- | --- | --- |
| FR-AUTH-01 | Registrasi hanya lewat Google (`/api/auth/google?redirect=…`) | M | `/register` tanpa field apapun |
| FR-AUTH-02 | Login kredensial hanya untuk akun lama yang punya `passwordHash` | M | Akun Google tanpa password → pesan jelas |
| FR-AUTH-03 | Sesi cookie `httpOnly`, `secure`, `sameSite=lax`, 30 hari, rotasi saat login | M | Tidak ada token di localStorage |
| FR-AUTH-04 | Profil: nama dapat diubah, email `disabled` | M | Simpan nama → sapaan dashboard ikut berubah |
| FR-AUTH-05 | Bagian ganti password **kondisional** (hanya akun lokal) | M | Akun OAuth melihat paragraf penjelasan |
| FR-AUTH-06 | Logout dengan dialog konfirmasi, lalu redirect ke `/` | M | Sesi dihapus dari DB, bukan hanya cookie |
| FR-AUTH-07 | Pengguna `SUSPENDED` ditolak saat login dan semua sesi dicabut | M | Pesan menyebut cara menghubungi dukungan |
| FR-AUTH-08 | MFA TOTP untuk akun admin | M | Tanpa MFA → hanya halaman enrol |
| FR-AUTH-09 | "Ingat perangkat" 30 hari untuk MFA | C | Cookie terpisah, dapat dicabut dari profil |

## 6. Dashboard pengguna (E6)

| ID | Requirement | Prioritas | Acceptance criteria |
| --- | --- | --- | --- |
| FR-DASH-01 | Ringkasan: kartu `Source code dimiliki`, `Total pembelian`, `Invoice` | M | Angka dihitung dari data nyata, bukan hardcode |
| FR-DASH-02 | Sapaan memakai kata pertama nama tampilan | M | Nama kosong → "Halo" tanpa koma menggantung |
| FR-DASH-03 | `Source Code Saya` menampilkan item yang punya entitlement aktif | M | Kosong → empty state + CTA katalog |
| FR-DASH-04 | `Riwayat Pembelian` hanya pembayaran berhasil, dengan tautan invoice | M | Status gagal/kedaluwarsa tidak muncul |
| FR-DASH-05 | `Riwayat Unduhan` **baru**: gratis dan premium, 50 terakhir, dengan tautan unduh ulang | M | Membedakan jalur gratis/premium |
| FR-DASH-06 | Empty state konsisten (judul + satu kalimat + tautan keluar) | M | Satu komponen dipakai ulang |
| FR-DASH-07 | Header berubah `Masuk` → `Dashboard` saat login | M | Tidak ada kedipan status salah (SSR) |

## 7. Konten publik (E7–E9)

| ID | Requirement | Prioritas | Acceptance criteria |
| --- | --- | --- | --- |
| FR-CMS-01 | Indeks tutorial + artikel dengan tag, tanggal, waktu baca, hero | M | Markdown/MDX dirender aman (tanpa HTML mentah dari pengguna) |
| FR-CMS-02 | Paginasi indeks tutorial | S | 12 per halaman |
| FR-CMS-03 | Sponsor: input link, nominal (default 1.000), kategori papan, deskripsi opsional | M | CTA berubah mengikuti nominal |
| FR-CMS-04 | Papan sponsor diurutkan nominal menurun, lalu waktu bayar | M | Setelah bayar + moderasi, tayang sesuai urutan |
| FR-CMS-05 | Request aplikasi: nama, email, judul, teknologi; status dilacak | M | Email konfirmasi + status dapat dilihat lewat tautan bertoken |
| FR-CMS-06 | Halaman jasa, kontak, privasi, syarat tersedia dan konsisten | M | Kontak tanpa formulir; semua kanal WhatsApp |
| FR-CMS-07 | Teks kebijakan sesuai implementasi nyata (OAuth, cookie, DOKU, retensi) | M | Tidak ada klaim bcrypt bila tidak dipakai |

## 8. Admin & superadmin (E10)

Rincian perilaku: [`09-superadmin-admin.md`](09-superadmin-admin.md).

| ID | Requirement | Prioritas | Acceptance criteria |
| --- | --- | --- | --- |
| FR-ADM-01 | Otorisasi kapabilitas `can(actor, capability)`; SUPERADMIN melewati semua | M | `USER` akses `/admin` → 403 |
| FR-ADM-02 | CRUD item lengkap termasuk tab Harga, Berkas, Galeri, SEO | M | Semua field §6.1 dokumen 09 tersimpan dan tervalidasi |
| FR-ADM-03 | Gate publikasi (berkas terverifikasi, thumbnail, screenshot, harga, deskripsi) | M | Tombol terbit nonaktif + alasan per butir |
| FR-ADM-04 | Perubahan harga hanya SUPERADMIN + `ItemPriceHistory` | M | ADMIN melihat field harga read-only |
| FR-ADM-05 | Antrean approval untuk ADMIN (`/admin/ulasan`) dengan diff | S | Setujui → terbit; tolak → kembali `DRAFT` + catatan |
| FR-ADM-06 | CRUD kategori & teknologi; tidak bisa hapus bila masih dipakai | M | Nonaktifkan sebagai gantinya |
| FR-ADM-07 | CRUD tutorial dengan pratinjau sisi server | M | Pratinjau identik dengan hasil publik |
| FR-ADM-08 | Moderasi sponsor; tolak dengan alasan | M | `REJECTED` tidak tayang, tanpa refund otomatis |
| FR-ADM-09 | Pipeline request aplikasi + notifikasi email per transisi | M | Setiap transisi mengirim tepat satu email |
| FR-ADM-10 | Pustaka media: unggah, alt wajib, dedup sha256, lacak pemakaian | M | Hapus media terpakai → ditolak + daftar pemakaian |
| FR-ADM-11 | Manajemen pesanan: lihat, cek gateway, tandai lunas manual, refund | M | Refund mencabut entitlement < 5 detik |
| FR-ADM-12 | Grant/revoke entitlement manual dengan alasan | M | Audit + alasan wajib |
| FR-ADM-13 | Manajemen pengguna: suspend, ubah peran, undang admin | M | Tidak bisa menurunkan SUPERADMIN terakhir |
| FR-ADM-14 | Pengaturan situs (identitas merek & aset, harga, iklan, pembayaran, email, SEO, keamanan) | M | Perubahan berlaku tanpa deploy |
| FR-ADM-21 | Aset merek dikelola lewat panel: logo (terang/gelap), wordmark, favicon, ikon PWA 192/512 + maskable, dan OG fallback; aset landing (hero, ilustrasi, gambar section) memakai pustaka media yang sama | M | Tidak ada aset merek/landing yang di-hardcode di `public/`; mengganti aset tidak memerlukan build. Bila belum ada unggahan, situs memakai fallback statis bertanda "default" |
| FR-ADM-15 | Audit log append-only + ekspor CSV 90 hari | M | Tabel menolak UPDATE/DELETE dari role aplikasi |
| FR-ADM-16 | Revisi konten + restore (tanpa menimpa riwayat) | S | Restore membuat versi baru |
| FR-ADM-17 | Aksi massal: terbitkan, arsipkan, ubah kategori | S | Maksimum 100 baris per aksi |
| FR-ADM-18 | Penghapusan lunak 30 hari sebelum permanen | M | Item terhapus bisa dipulihkan sebelum purge |
| FR-ADM-19 | Step-up MFA untuk aksi sensitif | M | Sesi > 15 menit → minta TOTP |
| FR-ADM-20 | Ringkasan operasional (pendapatan, antrean, webhook gagal) | S | Angka cocok dengan query database |

## 9. SEO, iklan, email (E11–E12)

| ID | Requirement | Prioritas | Acceptance criteria |
| --- | --- | --- | --- |
| FR-SEO-01 | `sitemap.xml` dinamis dengan `lastmod` | M | Item `ARCHIVED` tidak muncul |
| FR-SEO-02 | `robots.txt` menutup `/admin`, `/dashboard`, `/api` | M | Sesuai paritas |
| FR-SEO-03 | `X-Robots-Tag: noindex` pada semua rute admin & dashboard | M | Header terverifikasi |
| FR-SEO-04 | JSON-LD `Product` untuk item, `Article` untuk tutorial | S | Valid menurut Rich Results Test |
| FR-ADS-01 | Interstisial iklan dapat dimatikan lewat `Setting.ads.enabled` | M | Tanpa konfigurasi AdSense, halaman tetap berfungsi |
| FR-ADS-02 | Satu slot iklan per halaman, tanpa pop-under | M | Tidak ada `window.open` |
| FR-MAIL-01 | Email: konfirmasi order, akses siap, invoice, status request, undangan admin | M | Semua email punya versi teks, bukan hanya HTML |
| FR-MAIL-02 | Retry email gagal 3x dengan backoff | S | Kegagalan permanen tercatat |

---

## 10. Requirement non-fungsional

| ID | Kategori | Target terukur | Cara uji |
| --- | --- | --- | --- |
| NFR-01 | Performa | LCP p75 < 2,5 s (4G), CLS < 0,1, INP < 200 ms | Lighthouse CI + RUM |
| NFR-02 | Performa | Katalog p95 origin < 500 ms; HTML < 300 KB | k6 + ukur `Content-Length` |
| NFR-03 | Kapasitas | 200 req/s baca, 20 order/menit | k6 beban puncak |
| NFR-04 | Ketersediaan | 99,5%/bulan; halaman publik tersaji dari cache saat origin mati | Uji failover |
| NFR-05 | Keamanan | CSP nonce, HSTS 2 tahun, `nosniff`, `SAMEORIGIN`, tanpa `unsafe-inline` | Header check + CSP evaluator |
| NFR-06 | Keamanan | Tidak ada data kartu; hanya `providerRef` | Review skema + grep log |
| NFR-07 | Keamanan | Rate limit: unduhan 10/menit, login 10/menit, webhook tanpa batas tapi tervalidasi | Uji batas |
| NFR-08 | Aksesibilitas | WCAG 2.2 AA pada 6 halaman utama; 0 pelanggaran axe serius; kontras mengikuti pasangan token di `10-design-tokens.md` §8 | axe + uji keyboard manual |
| NFR-09 | Privasi | Analitik tanpa PII; IP disimpan sebagai hash + salt | Review kode |
| NFR-10 | Auditabilitas | 100% aksi admin tercatat; log tidak dapat diubah dari aplikasi | Uji grant DB |
| NFR-11 | Backup | RPO 24 jam, RTO 4 jam | Uji restore kuartalan |
| NFR-12 | Pemeliharaan | Typecheck + lint + test hijau; cakupan domain ≥ 70% | CI |
| NFR-13 | Kompatibilitas | 2 versi terakhir Chrome, Safari, Firefox, Edge; iOS 16+, Android 10+ | Uji manual matriks |
| NFR-14 | Observabilitas | Setiap error 5xx punya `requestId` yang bisa dicari | Simulasi error |
| NFR-15 | Lokalisasi | Bahasa Indonesia; format tanggal `id-ID`; rupiah tanpa desimal | Review UI |

---

## 11. Requirement yang sengaja tidak dibuat

| ID | Requirement | Alasan |
| --- | --- | --- |
| W-01 | Registrasi email+password untuk akun baru | Paritas: hanya Google. Kebijakan diselaraskan ke perilaku |
| W-02 | Unduhan gratis tercatat sebagai "pembelian" | Model data memisahkan `Download` dari `Order` |
| W-03 | Rantai shortlink iklan pihak ketiga | ADR-006 |
| W-04 | Halaman kosong untuk `page` di luar rentang | ADR-005 |
| W-05 | Refund otomatis | Risiko penyalahgunaan; manual + audit |
| W-06 | Multi-bahasa | Pasar tunggal, biaya pemeliharaan tidak sepadan |
