# Test Plan

| Field | Isi |
| --- | --- |
| Tujuan | Membuktikan setiap requirement ber-ID berjalan, dan setiap temuan investigasi tidak kembali |
| Cakupan | Unit, integrasi, E2E, non-fungsional, UAT |
| Alat | Vitest, Playwright, axe-core, k6, `docker compose` |

---

## 1. Piramida pengujian

| Lapis | Alat | Target | Cakupan |
| --- | --- | --- | --- |
| Unit | Vitest | < 5 s total | Harga, hak akses, parsing filter, state machine |
| Integrasi | Vitest + Postgres uji (Testcontainers) | < 60 s | Server action, transaksi order, invariant DB, webhook |
| E2E | Playwright | < 8 menit | 12 alur utama di `05-ux-flows.md` |
| Non-fungsional | k6, axe, Lighthouse CI | manual/terjadwal | Performa, aksesibilitas, keamanan header |
| UAT | manual oleh pemilik | 1 sesi | Skenario operasional nyata |

Aturan: unit test tidak menyentuh jaringan; integrasi selalu memakai DB sungguhan (bukan mock), karena bug yang paling mahal ada di transaksi.

---

## 2. Pelacakan ke investigasi

Setiap baris di matriks cakupan investigasi (di luar paket ini) harus punya test. Ini yang mencegah regresi paritas.

### 2.1 Pengunjung

| Baris | Test | Jenis |
| --- | --- | --- |
| P1 Beranda | `home.spec` — hero, item unggulan, footer | E2E |
| P2 Katalog | `catalog.spec` — 12 kartu, teks jumlah, paginasi | E2E |
| P3 Pencarian | `search.spec` — `kasir` (13 hasil di data seed), 0 hasil | E2E |
| P4 Filter tipe | `filter.spec` — `?type=PREMIUM` | E2E |
| P5 Filter kategori | `filter.spec` — `?kategori=laravel` | E2E |
| P6 Urutkan | `sort.spec` — 3 nilai menghasilkan urutan berbeda | E2E |
| P7 Paginasi | `pagination.spec` | E2E |
| P8 Detail gratis | `detail-free.spec` — dua CTA, metadata | E2E |
| P9 Detail premium | `detail-premium.spec` — CTA beli, tanpa unduhan gratis | E2E |
| P10 Unduhan gratis | `download-free.spec` — interstisial → token → berkas | E2E |
| P11 Login | `auth.spec` | E2E |
| P12 Registrasi | `auth.spec` — hanya satu CTA | E2E |
| P13 Request aplikasi | `request.spec` | E2E |
| P14 Donasi | `sponsor.spec` | E2E |
| P15 Jasa | `services.spec` | E2E |
| P16 Tutorial | `tutorial.spec` | E2E |
| P17 Menu Layanan | `header.spec` — klik, hover, Escape, `aria-expanded` | E2E |
| P18 Kontak | `static.spec` | E2E |
| P19 Privasi | `static.spec` — teks lengkap, bukan "Memuat..." | E2E |
| P19b Syarat | `static.spec` | E2E |
| P20 Responsif | `responsive.spec` — 375, 768, 929, 1024, 1440 | E2E + screenshot |
| P21 Kombinasi filter | `catalog-query.spec` | Integrasi |
| P22 Paginasi di luar rentang | `pagination.spec` — **wajib 308** | E2E |

### 2.2 Pengguna

| Baris | Test | Jenis |
| --- | --- | --- |
| U1 Registrasi Google | `auth.spec` (mock provider) | E2E |
| U2 Ringkasan dashboard | `dashboard.spec` | E2E |
| U3 Source code saya | `dashboard.spec` — kosong + berisi | E2E |
| U4 Riwayat pembelian | `dashboard.spec` — kosong + berisi | E2E |
| U5 Invoice | `invoice.spec` — snapshot harga, cetak | E2E |
| U6 Profil | `profile.spec` | E2E |
| U7 Simpan nama | `profile.spec` — sapaan berubah | E2E |
| U8 Ganti password | `profile.spec` — kondisional | E2E |
| U9 Logout | `auth.spec` — konfirmasi + sesi mati | E2E |
| U10 Unduh ulang | `download-premium.spec` | E2E |
| U11 Pembelian premium | `checkout.spec` (DOKU sandbox/mock) | E2E |
| U12 Riwayat unduhan gratis | `dashboard.spec` | E2E |
| U13 Header terautentikasi | `header.spec` | E2E |
| U14 Redirect tanpa sesi | `auth.spec` — `/dashboard` → `/login` | E2E |

### 2.3 Superadmin

| Baris | Test | Jenis |
| --- | --- | --- |
| S1 Akses `/admin` | `admin-auth.spec` — USER → 403, anonim → login | E2E |
| S2 Otorisasi peran | `rbac.spec` — matriks §2.3 dokumen 09 | Integrasi |
| S3 Manajemen konten | `admin-content.spec` — item, kategori, tutorial, media | E2E |
| S4 Otorisasi tanpa hak | `rbac.spec` — aksi langsung ke server action tanpa kapabilitas → 403 | Integrasi |

---

## 3. Regresi wajib (temuan investigasi)

Setiap butir di bawah adalah bug nyata dari situs lama. Test ini **tidak boleh** dihapus.

| ID | Regresi | Test |
| --- | --- | --- |
| REG-01 | Paginasi rentang terbalik ("1177–69") | `GET /source-code?page=99` → 308 ke halaman terakhir, tanpa teks terbalik |
| REG-02 | Halaman di luar rentang membalas 200 | status harus 308 |
| REG-03 | Dua searchbox bernama sama | `getByRole('searchbox', { name: 'Cari di katalog' })` unik |
| REG-04 | Paginasi tanpa `aria-current` | `locator('[aria-current=page]')` ada tepat satu |
| REG-05 | Dropdown tidak responsif terhadap klik | klik membuka, Escape menutup, `aria-expanded` berubah |
| REG-06 | Tidak ada CSP | header `Content-Security-Policy` memuat `nonce-` |
| REG-07 | Rantai redirect ke domain iklan | daftar host selama alur unduhan gratis **hanya** host situs |
| REG-08 | Tautan Drive terekspos | body respons unduhan tidak memuat `drive.google.com` |
| REG-09 | Unduhan gratis tidak tercatat | `Download` bertambah setelah alur selesai |
| REG-10 | `theme_color` manifest tidak konsisten | manifest `#58d3db` = `--primary` |
| REG-11 | Kebijakan menyebut password padahal tanpa form | teks kebijakan tidak menjanjikan registrasi password |
| REG-12 | Logout tanpa konfirmasi | dialog muncul sebelum sesi dihapus |
| REG-13 | `/admin` hanya dilindungi `robots.txt` | akses langsung tanpa peran → 403 |
| REG-14 | Teks "Memuat..." tertangkap bot/SSR | HTML server memuat isi kebijakan lengkap |
| REG-15 | Sitemap tanpa `lastmod` | setiap `<url>` punya `lastmod` |

---

## 4. Kasus tepi yang wajib diuji

| Area | Kasus |
| --- | --- |
| Katalog | `page=0`, `page=-1`, `page=abc`, `page=1.5`, `page=999999` |
| Pencarian | string kosong, spasi saja, 500 karakter, karakter `%` dan `_` (wildcard SQL), emoji, HTML |
| Filter | `type=free` (huruf kecil), `type=GRATIS`, `kategori=tidak-ada`, dua `kategori` sekaligus |
| Sort | `sort=random`, `sort=`, `sort` ganda |
| Item | slug dengan unicode, slug 80 karakter, item `ARCHIVED` |
| Unduhan | token dipakai dua kali, token kedaluwarsa, entitlement dicabut di tengah streaming, berkas Drive hilang |
| Pembayaran | webhook ganda, webhook untuk order tidak dikenal, webhook dengan signature salah, nominal tidak cocok, order kedaluwarsa lalu dibayar |
| Concurrent | dua klik "Beli" bersamaan (harus satu order), dua refund bersamaan, dua approve sponsor bersamaan |
| Admin | publish tanpa berkas, ubah slug item terbit, hapus media terpakai, ADMIN mencoba ubah harga |
| Auth | sesi kedaluwarsa saat submit, `redirect=//evil.com`, `redirect=https://evil.com`, akun suspended |
| Data | harga 0, harga negatif, `noAdsPriceIdr` pada item premium |

---

## 5. Pengujian non-fungsional

### 5.1 Performa (k6)

| Skenario | Beban | Ambang lulus |
| --- | --- | --- |
| Baca katalog | 200 rps, 5 menit | p95 < 500 ms, error < 0,1% |
| Detail item | 100 rps, 5 menit | p95 < 400 ms |
| Checkout | 20 order/menit, 3 menit | p95 < 1,5 s, 0 order ganda |
| Unduhan | 10 konkuren, berkas 20 MB | Semua selesai, memori server < 1,5× baseline |

### 5.2 Aksesibilitas

- axe-core di 6 halaman (beranda, katalog, detail, login, dashboard, admin item): **0 pelanggaran serius/kritis**.
- Uji keyboard manual: tab order, fokus terlihat, Escape pada dialog/dropdown/drawer, skip link.
- Uji screen reader: NVDA (Windows) pada alur unduhan gratis dan checkout.

### 5.3 Keamanan

| Uji | Harapan |
| --- | --- |
| Header keamanan | CSP (nonce), HSTS, `nosniff`, `SAMEORIGIN`, `Permissions-Policy` |
| CSRF | POST tanpa Origin/cookie CSRF → 403 |
| Rate limit | 11 request/menit ke `/api/download` → 429 |
| Path traversal | `slug=../../etc/passwd` → 400 |
| SSRF | `demoUrl=http://169.254.169.254` → ditolak |
| Eskalasi peran | ADMIN mengirim `role=SUPERADMIN` ke server action → 403 |
| Enumerasi | `/api/orders/[orderNo]` milik orang lain → 404 (bukan 403, agar tidak membocorkan keberadaan) |
| Log | grep log: tidak ada token, cookie, atau email lengkap |

---

## 6. Data uji

| Dataset | Isi |
| --- | --- |
| `seed-minimal` | 3 item, 2 tutorial, 1 kategori |
| `seed-parity` | 69 item (paritas snapshot), 38 tutorial, 11 kategori, 4 premium |
| `seed-load` | 5.000 item untuk uji paginasi & indeks |
| Akun uji | `user@test`, `admin@test` (Editor), `publisher@test`, `super@test` |

Aturan: data uji tidak boleh memakai email domain nyata. Pembayaran memakai DOKU sandbox dengan nominal minimum.

---

## 7. Checklist peluncuran

**Teknis**
- [ ] CI hijau di commit rilis; artefak image ter-tag
- [ ] Migrasi diuji pada salinan DB produksi
- [ ] Backup terbaru + uji restore sukses < 7 hari
- [ ] Semua alert aktif dan diuji kirim
- [ ] Rollback image sebelumnya tersedia dan teruji
- [ ] `robots.txt`, `sitemap.xml`, `manifest` benar
- [ ] Header keamanan diverifikasi di domain produksi
- [ ] Rate limit aktif di produksi
- [ ] MFA aktif untuk semua akun admin

**Produk**
- [ ] Satu unduhan gratis nyata berhasil
- [ ] Satu pembelian nyata berhasil + invoice + unduh ulang
- [ ] Refund diuji di staging
- [ ] Email transaksional masuk (bukan spam)
- [ ] Kebijakan privasi & S&K sesuai implementasi
- [ ] Teks kontak dan nomor WhatsApp benar

**Operasional**
- [ ] Runbook insiden dibaca dan dipahami pemilik
- [ ] Akses admin dibuat untuk pemilik, bukan developer
- [ ] Developer kehilangan akses DB produksi setelah serah terima (least privilege)
- [ ] Jadwal backup dan rotasi rahasia tercatat

---

## 8. Setelah peluncuran

| Waktu | Aktivitas |
| --- | --- |
| +1 jam | Pantau error rate, latensi origin, webhook |
| +1 hari | Periksa funnel unduhan & checkout, email bounce |
| +7 hari | Review audit log admin, ukuran DB, biaya |
| +30 hari | Uji restore backup, tinjau rate limit berdasarkan data nyata, evaluasi migrasi R2 |
