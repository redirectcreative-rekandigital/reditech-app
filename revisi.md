# Revisi PRD — PIN Pengganti MFA, Hapus ADMIN, Panel `/superadmin`

| Field | Isi |
| --- | --- |
| Status | **Draf untuk diskusi — belum dieksekusi** |
| Tanggal | 28 Oktober 2026 |
| Dasar | Instruksi pemilik: hapus MFA TOTP dan login kedua; ganti dengan PIN default `123456`; hapus peran `ADMIN` dan seluruh penamaan `admin`/`/admin`; panel pindah ke `/superadmin`; peran hanya `SUPERADMIN` dan `USER`, guest = pengunjung anonim |
| Dampak | `prd/01`–`12`, `README.md`, `prisma/schema.prisma` + migrasi, `src/lib/auth/*`, `src/lib/panel/*`, `src/proxy.ts`, `src/components/layout/*`, seluruh rute panel, seed, test |

---

## 1. Keputusan yang sudah tetap

| # | Keputusan | Catatan |
| --- | --- | --- |
| R-01 | **MFA TOTP dihapus seluruhnya** | Enrol, verifikasi, kode pemulihan, step-up, QR, `otplib`/`qrcode`, dan env `MFA_ENCRYPTION_KEY` tidak dipakai lagi |
| R-02 | **Tidak ada login dua langkah** | Tidak ada lagi halaman verifikasi kedua (`/login/mfa`) maupun gerbang `/superadmin/mfa` |
| R-03 | **Admin/superadmin masuk dengan PIN**, default **`123456`** | Mekanisme identitas (PIN saja vs email + PIN) belum diputuskan — lihat §3 Q1 |
| R-04 | **Peran `ADMIN` dihapus** | Enum `Role` menjadi `USER` dan `SUPERADMIN`; `VISITOR`/guest tetap implisit (tanpa akun) |
| R-05 | **Kapabilitas tidak lagi dibagi ke beberapa admin** | SUPERADMIN memegang semua; USER tidak punya kapabilitas panel. Bundel Editor/Publisher/Commerce Ops/User Admin tidak berlaku |
| R-06 | **Antrean approval `/superadmin/ulasan` dihapus** | Tidak ada lagi alur ADMIN → SUPERADMIN; SUPERADMIN menerbitkan langsung |
| R-07 | **Rute panel `/admin` diganti `/superadmin`** | `/admin/*` → `308 /superadmin/*`; route group `(admin)` → `(panel)`; tidak ada lagi istilah "admin" di URL, UI, nama komponen, atau tabel audit |
| R-08 | **Guest = pengunjung anonim** | Peran tersimpan hanya `USER` dan `SUPERADMIN`; guest tidak punya baris `users` dan tidak punya sesi |

---

## 2. Ringkasan perubahan perilaku

| Sebelum | Sesudah |
| --- | --- |
| `/superadmin/*` tanpa MFA → `307 /superadmin/mfa` | Tidak ada gerbang MFA; langsung dinilai sesi + peran |
| Login: kata sandi → `/login/mfa` (TOTP) → sesi | Login: satu langkah (lihat Q1) → sesi langsung |
| 10 kode pemulihan, rahasia TOTP terenkripsi | Tidak ada; PIN disimpan sebagai hash (usulan) |
| Step-up TOTP untuk refund/hapus/ubah peran | Tidak ada; konfirmasi ketik frasa tetap dipertahankan |
| Peran `USER`, `ADMIN`, `SUPERADMIN` | Peran `USER`, `SUPERADMIN` (+ guest implisit) |
| `ADMIN` dengan bundel kapabilitas | Tidak ada; hanya SUPERADMIN yang boleh menulis |
| `/superadmin/ulasan` untuk approval | Rute dihapus |
| Seed membuat `editor@reditech.id` | Akun uji hanya `superadmin@reditech.id` (SUPERADMIN) dan `pengguna@reditech.id` (USER) |
| Navigasi mobile memakai drawer/sidebar kiri | **Mode aplikasi**: bilah tab bawah + halaman menu `Lainnya`; tanpa drawer kiri |
| Panel di `/admin`, audit `AdminAuditLog` | Panel di `/superadmin`, audit `AuditLog` (`audit_logs`), route group `(panel)` |
| Tanpa footer | Tanpa footer (ditegaskan untuk kedua panel) |

---

## 3. Pertanyaan terbuka (perlu keputusan sebelum eksekusi)

| # | Pertanyaan | Pilihan | Usulan default |
| --- | --- | --- | --- |
| **Q1** | Bagaimana identitas saat login PIN? | (a) PIN saja; (b) email + PIN; (c) kata sandi + PIN | **Diputuskan: (b) email + PIN** |
| **Q2** | PIN boleh diganti? | (a) bisa diganti dari panel; (b) tetap `123456` selamanya | **(a)**; `123456` hanya nilai awal, dan panel menandai "masih default" |
| **Q3** | Kebijakan brute force PIN 6 digit? | (a) rate limit 10/menit + kunci akun setelah 5 gagal (15 menit); (b) hanya rate limit; (c) tanpa proteksi | **(a)**; tanpa ini PIN 6 digit dapat ditebak dalam hitungan jam |
| **Q4** | SUPERADMIN boleh login lewat Google OAuth (M4)? | (a) ya; (b) tidak, tetap PIN; (c) Google + PIN | **Diputuskan: (b) tetap PIN**; Google OAuth hanya untuk USER |
| **Q5** | `AdminInvite` dan `user:role:manage` dipertahankan? | (a) dihapus — hanya satu SUPERADMIN; (b) tetap ada untuk mengundang SUPERADMIN lain | **(a) dihapus**, sesuai "hanya SUPERADMIN dan USER" |
| **Q6** | Nasib akun `ADMIN` yang sudah ada di database | (a) diturunkan ke `USER`; (b) dihapus; (c) dinaikkan ke `SUPERADMIN` | **Diputuskan: (a) diturunkan ke `USER`**, sesi dicabut, undangan dihapus, audit `user.role_downgrade` (P-01) |
| **Q7** | PIN disimpan sebagai apa? | (a) hash `scrypt` (pola sama dengan kata sandi lama); (b) PIN mentah/hardcoded | **(a) hash**, kolom `pinHash` |
| **Q8** | Halaman `/superadmin/mfa` dan `/login/mfa` dihapus atau dijadikan redirect? | (a) redirect `308`; (b) 404; (c) 410 | **Diputuskan (a):** `/login/mfa` → `308 /login` (bawa `redirect`); `/superadmin/mfa` dan `/admin/mfa` → `308 /superadmin/keamanan`, diatur di proxy (P-02) |

---

## 4. Perubahan skema data (usulan, menunggu Q1/Q4/Q5/Q7)

```prisma
enum Role {
  USER
  SUPERADMIN    // ADMIN dihapus
}

model User {
  // dihapus:
  // mfaEnabled      Boolean    @default(false)
  // mfaSecretEnc    String?
  // mfaRecoveryEnc  String[]   @default([])
  // permissions     String[]   @default([])

  // ditambahkan (bila PIN disimpan):
  pinHash         String?     // scrypt$N$r$p$salt$hash
  pinUpdatedAt    DateTime?
  failedPinCount  Int         @default(0)
  pinLockedUntil  DateTime?

  // tidak berubah: email, passwordHash (akun lama), role, status
  auditLogs       AuditLog[]  // relasi berganti nama
}

model AuditLog {
  // sebelumnya AdminAuditLog
  // ...
  @@map("audit_logs")  // sebelumnya admin_audit_logs
}
```

Catatan migrasi:

1. PostgreSQL tidak bisa menghapus nilai enum secara langsung; migrasi harus membuat tipe baru `Role_new`, menukar kolom, lalu menghapus tipe lama.
2. **Diputuskan (P-01):** baris dengan `role = 'ADMIN'` diturunkan menjadi `USER` **sebelum** tipe lama dihapus, dengan sesi dicabut, `permissions` dikosongkan (lalu kolomnya dihapus), undangan dihapus, dan satu baris audit `user.role_downgrade` per akun. Laporan pra-migrasi wajib menyimpan `id`, `email`, `permissions`, jumlah tutorial/revisi, dan jumlah sesi.
3. Kolom MFA di-`DROP`; tidak ada data yang perlu dipertahankan (kode pemulihan memang sekali pakai).
4. `AdminInvite` dihapus bila Q5 = (a), termasuk relasi `invitesSent` di `User`.
5. `permissions String[]` dihapus (Q11); tidak ada lagi kapabilitas per aktor.
6. `AdminAuditLog` → `AuditLog`; tabel `admin_audit_logs` → `audit_logs` lewat `ALTER TABLE ... RENAME`, sehingga data audit lama tetap utuh. Indeks dan `REVOKE UPDATE, DELETE` ikut disesuaikan.
7. Seed: `admin@reditech.id` → `superadmin@reditech.id`; `editor@reditech.id` dihapus.
8. **P-01 (diputuskan):** urutan migrasi `ADMIN` → `USER`:
   1. Simpan laporan pra-migrasi: `id`, `email`, `status`, `permissions`, `lastLoginAt`, jumlah tutorial, revisi, dan sesi.
   2. `INSERT` audit `user.role_downgrade` (before `{role:ADMIN}`, after `{role:USER}`, actor `migration`).
   3. `DELETE FROM sessions` untuk akun tersebut.
   4. `DELETE FROM admin_invites` (semua undangan).
   5. `UPDATE users SET role='USER', permissions='{}'`.
   6. Tukar enum, rename tabel audit, drop kolom/tabel lama.
   7. Verifikasi: 0 baris `ADMIN`, jumlah `tutorials`/`revisions` tidak berubah, 0 sesi tersisa.
   8. Rollback: restore dump; bila manual, tambah kembali nilai `ADMIN` dan pulihkan `permissions` dari laporan.

---

## 5. Alur login baru

### 5.1 Usulan (Q1 = b, Q2 = a, Q3 = a)

| Langkah | Aksi | Hasil |
| --- | --- | --- |
| 1 | `GET /login` | Satu formulir: email + PIN (6 digit), tanpa tab/opsi MFA |
| 2 | `POST loginAction` | Cek email ada, `role = SUPERADMIN`, `status = ACTIVE`, PIN cocok, tidak terkunci |
| 3 | Sukses | Buat baris `sessions`, cookie `rd_session` (8 jam untuk SUPERADMIN), `303` ke `/superadmin` atau `redirectTo` |
| 4 | Gagal | `{ error }` generik (tidak membocorkan email terdaftar), `failedPinCount++`, audit `auth.login.failed` |
| 5 | 5× gagal | `pinLockedUntil = now + 15 menit`, `429`/pesan "Coba lagi dalam 15 menit" |
| 6 | Logout | Hapus baris `sessions`, hapus cookie, `303 /` |

USER (pembeli) tetap memakai Google OAuth dan akun lama berkata sandi; PIN **tidak** berlaku untuk USER.

### 5.2 Yang dihapus dari alur

- Cookie `rd_mfa` (tantangan) dan `rd_stepup`.
- Halaman `/login/mfa` dan `/superadmin/mfa`.
- Aturan redirect di proxy: `/login/mfa` → `308 /login` (parameter `redirect` dipertahankan); `/superadmin/mfa` dan `/admin/mfa` → `308 /superadmin/keamanan`; cookie `rd_mfa` dihapus saat redirect.
- Server Action `verifyMfaAction`, `startEnrollmentAction`, `confirmEnrollmentAction`, `disableMfaAction`.
- Audit `auth.mfa.challenge`, `auth.mfa.enable`, `auth.mfa.disable`.
- Env `MFA_ENCRYPTION_KEY` di `08-deployment.md` dan `.env.example`.

### 5.3 Guard baru (proxy)

Urutan evaluasi `/superadmin*`:

1. Tidak ada sesi → `307 /login?redirect=…`
2. Sesi tidak sah/kedaluwarsa → `307 /login` + hapus cookie
3. `role !== SUPERADMIN` → `403` (replay `/403`)
4. Lanjutkan

Tidak ada lagi cabang "MFA belum aktif". Karena hanya ada satu peran panel, pemeriksaan kapabilitas per rute dihapus seluruhnya (P-03 = B): semua guard halaman memakai `requireSuperadmin()`, semua Server Action memakai `actionActor()` tanpa argumen, dan proxy cukup memeriksa `role !== "SUPERADMIN"`.

---

## 6. Matriks peran baru

| Kemampuan | Guest (anonim) | USER | SUPERADMIN |
| --- | --- | --- | --- |
| Lihat katalog & detail | ✔ | ✔ | ✔ |
| Unduh gratis (lewat iklan) | ✔ | ✔ | ✔ |
| Beli item / tanpa-iklan | ✔ (guest checkout) | ✔ | ✔ |
| Dashboard pribadi | ✖ | ✔ | ✔ |
| Masuk ke `/superadmin/*` | ✖ | ✖ (403) | ✔ |
| CRUD item, kategori, teknologi, tutorial, media | ✖ | ✖ | ✔ |
| Terbitkan / arsipkan / hapus permanen | ✖ | ✖ | ✔ |
| Ubah harga | ✖ | ✖ | ✔ |
| Pesanan, refund, entitlement | ✖ | ✖ | ✔ |
| Pengguna & peran, pengaturan situs, audit + ekspor | ✖ | ✖ | ✔ |

---

## 7. Dampak per dokumen PRD

| Dokumen | Bagian yang berubah | Isi perubahan |
| --- | --- | --- |
| `01-prd.md` | §4.1 Admin, §5 tabel izin, §6 E10, §9 RP, §10 Q9, §12 rilis | Hapus kolom ADMIN; hanya SUPERADMIN; hapus "MFA wajib" dari v1.2; Q9 ditutup |
| `02-requirements.md` | §5 FR-AUTH-08/09, §8 FR-ADM-05/13/19, §10 NFR | Ganti MFA dengan PIN (`FR-AUTH-08` baru: PIN default, ganti, kunci); hapus antrean approval; hapus bundel peran |
| `03-data-model.md` | §2 `Role`, `User`, `AdminInvite`; §3 invariant; §6 retensi | Terapkan §4 dokumen ini; tidak ada invariant baru selain `pinHash` wajib untuk SUPERADMIN |
| `04-api-spec.md` | §6 tabel aksi auth, §7.1 `admin.invite`/`user.setRole` | Ganti aksi MFA dengan `pin.change`; hapus `admin.invite`; `user.setRole` dihapus bila Q5 = (a) |
| `05-ux-flows.md` | S05 (state MFA), S24 (antrean), F5, F12, §3 responsif, §6 | Hapus state/flow MFA dan undangan admin; hapus S24; **§3 diganti mode aplikasi mobile** (bilah tab bawah, `/superadmin/menu`, `/dashboard/akun`, tanpa drawer kiri) |
| `06-milestones.md` | M3 keluaran, M4, M7 | M3: "login admin + PIN" bukan MFA; hapus fase 2a catatan mengenai approval; M7 hapus "MFA wajib" |
| `07-test-plan.md` | §3 REG, §4 kasus tepi, §5.3, §7 checklist | Hapus uji MFA; tambah uji PIN: default, salah 5×, terkunci, ganti PIN; hapus REG yang menyebut MFA; tambah uji navigasi mobile (tab bawah, `/superadmin/menu`, back) |
| `08-deployment.md` | §3 env, §7 alert, §10 serah terima | Hapus `MFA_ENCRYPTION_KEY`; ganti `SEED_ADMIN_PIN` → `SEED_SUPERADMIN_PIN`; checklist "MFA aktif" → "PIN default sudah diganti" |
| `09-superadmin-admin.md` → **`09-panel-superadmin.md`** | Seluruh dokumen | **Ganti nama berkas** dan semua tautan ke sana; §2 peran hanya SUPERADMIN/USER; hapus §2.2 bundel, §2.3 matriks per ADMIN, §3 approval; §4 struktur memakai `/superadmin/*`; §8 tanpa MFA |
| `10-design-tokens.md` | §10 | Catatan chart tetap belum dipasang + alasan kontras aqua (lihat §9) |
| `11-component-inventory.md` | §5 tata letak, §9 `MfaSetup`, §10 `PermissionEditor`, `ApprovalQueueRow` | Hapus tiga komponen; tambah `MobileTabBar`, `MobileMenuScreen`, `PanelHeader`, `PanelBreadcrumb`, `UserMenu`, `NotificationBell`; jumlah komponen domain 55 − 3 + 4 = **56** |
| `12-route-map.md` | §2 pohon, §5 panel, §6 auth, §7 guard matrix, §8 redirect, §11 cache, §12 proxy, §12.3 cookie | Seluruh `/admin` → `/superadmin`; hapus `/superadmin/mfa`, `/login/mfa`, `/superadmin/ulasan`; tambah `/superadmin/menu` dan `/dashboard/akun`; guard `/dashboard*`; hapus `rd_mfa`, `rd_stepup` |
| `README.md` | Status, Autentikasi admin, Struktur, Yang belum ada | Tulis ulang bagian autentikasi; hapus penyebutan MFA/TOTP |

---

## 8. Revisi Navigasi Panel (sidebar + header)

### 8.1 Kondisi sekarang (hasil pemeriksaan kode)

| Area | Kondisi |
| --- | --- |
| Layout panel | `src/app/(panel)/layout.tsx` (dulu `(admin)`) sudah punya header (brand, `/ Panel`, badge peran, email, keluar) + nav kiri `<details>` untuk mobile + `<div className="hidden lg:block">` untuk desktop |
| Navigasi panel | `src/lib/panel/nav.ts` (dulu `src/lib/admin/nav.ts`) — 4 grup, 15 item, disaring per kapabilitas |
| Layout user | `src/app/(app)/layout.tsx` memakai `AppShell` sementara: header + nav kiri biasa + badge "Guard menyusul M4" |
| Guard dashboard | **Belum ada**; proxy hanya memasang `noindex` untuk `/dashboard`, tidak mengalihkan ke login |
| Footer | Tidak ada di kedua panel (tetap dipertahankan: **tanpa footer**) |
| Halaman | Hanya `/superadmin/kategori` dan `/superadmin/teknologi` yang berfungsi; sisanya `RouteStub` |

### 8.2 Keputusan navigasi

| # | Keputusan |
| --- | --- |
| N-01 | **Tanpa footer** di dashboard USER maupun panel SUPERADMIN; konten `min-h-dvh` sampai bawah |
| N-02 | `AppShell` sementara diganti `AppSidebar` berbasis primitif shadcn `sidebar` + `PanelHeader` bersama; sidebar **hanya** untuk ≥768px |
| N-03 | Sidebar **collapsible** (mode rail ikon), grup berjudul, item aktif `aria-current="page"`, badge angka untuk antrean |
| N-04 | Header desktop `sticky top-0` 64px: trigger sidebar, breadcrumb, pencarian panel (SUPERADMIN), aksi cepat (SUPERADMIN), notifikasi, menu user |
| N-05 | `/dashboard*` **wajib dijaga** di proxy (`307 /login?redirect=…`) sebagai bagian revisi ini, bukan menunggu M4 |
| N-06 | Menu `Antrean ulasan` dihapus (tidak ada ADMIN); menu `MFA` diganti `Keamanan akun (PIN)` di `/superadmin/keamanan` |
| N-07 | Dashboard USER **tidak** memuat pencarian global atau menu admin; hanya navigasi akun |
| N-08 | **Mobile `<768px` seperti aplikasi**: tanpa sidebar dan tanpa drawer kiri; navigasi utama lewat **bilah tab bawah** yang menetap + halaman menu penuh untuk item lainnya |

### 8.3 Wireframe header & sidebar

**SUPERADMIN**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ☰  Panel / Katalog / Item            ⌘K Cari di panel    ＋   🔔³   (RD) ▾  │
├──────────────┬───────────────────────────────────────────────────────────────┤
│ Utama        │                                                               │
│  Ringkasan   │  <konten halaman>                                             │
│ Katalog      │                                                               │
│  Item        │                                                               │
│  Kategori    │                                                               │
│  Teknologi   │                                                               │
│  Tutorial    │                                                               │
│ Penjualan    │                                                               │
│  Pesanan  3  │                                                               │
│  Entitlement │                                                               │
└──────────────┴───────────────────────────────────────────────────────────────┘
```

**USER**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ☰  Dashboard / Ringkasan                        Lihat situs    🔔²   (AD) ▾  │
├──────────────┬───────────────────────────────────────────────────────────────┤
│ Akun         │                                                               │
│  Ringkasan   │  <konten halaman>                                             │
│  Source code │                                                               │
│  Pembelian   │                                                               │
│  Unduhan     │                                                               │
│ Pengaturan   │                                                               │
│  Profil      │                                                               │
│  Keamanan    │                                                               │
└──────────────┴───────────────────────────────────────────────────────────────┘
```

### 8.4 Anatomi header

| Posisi | Elemen | USER | SUPERADMIN | Perilaku |
| --- | --- | --- | --- | --- |
| Kiri | `SidebarTrigger` | ✔ | ✔ | **Hanya ≥768px**; `aria-label="Buka atau tutup menu"`, target ≥44px. Di mobile tidak ada trigger karena sidebar tidak dipakai |
| Kiri | Breadcrumb | ✔ | ✔ | `Dashboard / Ringkasan`, `Panel / Katalog / Item`; item terakhir `aria-current="page"`; grup menaut ke indeksnya |
| Kiri | Badge peran | — | ✔ `Superadmin` | tone `premium`, hanya desktop |
| Kanan | Pencarian `⌘K` | — | ✔ | Membuka `Command`; placeholder "Cari item, pesanan, pengguna"; `aria-label="Cari di panel"` (berbeda dari searchbox publik) |
| Kanan | Aksi cepat `＋` | — | ✔ | Varian `outline`/`secondary` (bukan aqua, agar aturan satu-primary tetap); isi: Item baru, Tutorial baru, Unggah media |
| Kanan | Notifikasi | opsional | ✔ | Badge angka; isi: pesanan perlu tindakan, webhook gagal, sponsor/request baru; kosong → `EmptyState` |
| Kanan | `Lihat situs` | ✔ | ✔ | `target="_blank" rel="noopener"`; teks di desktop, ikon di mobile |
| Kanan | Menu user | ✔ | ✔ | Avatar inisial + nama (desktop) atau avatar saja (mobile) |

### 8.5 Dropdown user

| Item | USER | SUPERADMIN | Aksi |
| --- | --- | --- | --- |
| Nama + email | ✔ | ✔ | Read-only; email tidak dapat diubah |
| Profil | ✔ | ✔ | `/dashboard/profile`; SUPERADMIN ke profilnya sendiri di `/superadmin/pengguna/[id]` |
| Keamanan | ✔ | ✔ | USER: sesi aktif, kata sandi (akun lokal), status Google; SUPERADMIN: **ganti PIN** |
| Lihat situs | ✔ | ✔ | `/` |
| Keluar | ✔ | ✔ | `AlertDialog` "Keluar dari akun ini?" → hapus sesi DB → `/` |

### 8.6 Menu sidebar

**USER** — grup `Akun`: Ringkasan, Source code saya, Pembelian, Unduhan. Grup `Pengaturan`: Profil, Keamanan. Bawah: `Kembali ke situs`, `Keluar`.

**SUPERADMIN**

| Grup | Item | Rute | Status |
| --- | --- | --- | --- |
| Utama | Ringkasan | `/superadmin` | stub |
| Katalog | Item | `/superadmin/item` | stub |
| | Kategori | `/superadmin/kategori` | **berfungsi** |
| | Teknologi | `/superadmin/teknologi` | **berfungsi** |
| | Tutorial | `/superadmin/tutorial` | stub |
| Penjualan | Pesanan (badge PENDING) | `/superadmin/pesanan` | stub |
| | Entitlement | `/superadmin/entitlement` | stub |
| Komunitas | Sponsor (badge PENDING_REVIEW) | `/superadmin/sponsor` | stub |
| | Usulan aplikasi (badge NEW) | `/superadmin/request` | stub |
| Konten | Media | `/superadmin/media` | stub |
| Sistem | Pengguna | `/superadmin/pengguna` | stub |
| | Pengaturan | `/superadmin/pengaturan` | stub |
| | Audit | `/superadmin/audit` | stub |
| Bawah | Keamanan akun (PIN) | `/superadmin/keamanan` | rute baru |
| | Lihat situs · Keluar | `/` · aksi | sudah ada |

Dihapus dari menu: `Antrean ulasan` (`/superadmin/ulasan`) dan `Keamanan akun (MFA)` (`/superadmin/mfa`).

### 8.7 Perilaku responsif — mobile seperti aplikasi

| Breakpoint | Perilaku |
| --- | --- |
| `< 768px` | **Mode aplikasi**: tanpa sidebar, tanpa drawer kiri. Header ringkas 56px (judul halaman, ikon pencarian untuk SUPERADMIN, notifikasi, avatar) + **bilah tab bawah** menetap. Menu lain dibuka lewat tab `Lainnya` berupa halaman menu penuh |
| `768–1023px` | Sidebar rail ikon (bisa dibuka penuh); tanpa bilah tab bawah; breadcrumb penuh |
| `≥ 1024px` | Sidebar terbuka default; header menampilkan pencarian, aksi cepat, nama user; tanpa bilah tab bawah |

#### 8.7.1 Bilah tab bawah (mobile)

```
┌──────────────────────────────────────────────┐
│                                              │
│                <konten halaman>              │
│                                              │
├──────────────────────────────────────────────┤
│  ▣        ▤         ▦         ◇        ◯    │
│ Ringkasan  Item    Pesanan  Lainnya   Akun   │
└──────────────────────────────────────────────┘
   ↑ aman dari home-indicator (safe-area-inset-bottom)
```

Aturan:

- `position: fixed; bottom: 0`, tinggi **56px** + `padding-bottom: env(safe-area-inset-bottom)`, `bg-background`, `border-t border-border`, `z-40`.
- Maksimum **5 tab**; ikon `lucide` 24px + label 12px di bawahnya (label wajib, bukan ikon saja).
- Item aktif: indikator garis atas **2px `--foreground`**, ikon terisi, label `font-semibold`; **bukan** aqua sebagai satu-satunya penanda (aqua 1,79:1 di atas putih).
- Badge angka pada tab `Pesanan`/`Lainnya` bila ada antrean.
- Konten wajib `padding-bottom: calc(56px + env(safe-area-inset-bottom) + 16px)` agar tidak tertutup.
- Bilah tab hanya dirender di dalam `(app)` dan `(panel)`; tidak muncul di halaman publik, `/login`, `/download/*`, `/checkout/*`.

**Tab USER** (5): `Ringkasan` · `Source code` · `Pembelian` · `Unduhan` · `Akun`.
`Akun` membuka halaman ringkas berisi Profil, Keamanan, Lihat situs, Keluar.

**Tab SUPERADMIN** (4): `Ringkasan` · `Item` · `Pesanan` · `Lainnya`.
`Lainnya` membuka halaman menu penuh (§8.7.2).

#### 8.7.2 Halaman menu `Lainnya` (mobile, SUPERADMIN)

Bukan sheet setengah layar dan bukan sidebar; halaman penuh dengan daftar bergrup, baris ≥44px, chevron, dan badge:

```
┌──────────────────────────────────────────────┐
│ ←  Menu                                      │
├──────────────────────────────────────────────┤
│ Katalog                                      │
│  Kategori                              ›     │
│  Teknologi                             ›     │
│  Tutorial                              ›     │
│ Penjualan                                    │
│  Entitlement                           ›     │
│ Komunitas                                    │
│  Sponsor                           3   ›     │
│  Usulan aplikasi                   5   ›     │
│ Sistem                                       │
│  Media                                 ›     │
│  Pengguna                              ›     │
│  Pengaturan                            ›     │
│  Audit                                 ›     │
│  Keamanan akun (PIN)                   ›     │
├──────────────────────────────────────────────┤
│ Lihat situs        Keluar                    │
└──────────────────────────────────────────────┘
```

- Rute: `/superadmin/menu` (bukan overlay), sehingga tombol back Android/browser bekerja wajar.
- Breadcrumb mobile hanya menampilkan halaman aktif (`Item`, `Menu`), bukan seluruh jalur.
- Pencarian panel di mobile berupa ikon di header yang membuka `Command` dalam `Sheet`.
- Aksi cepat `+` di header (bukan FAB) agar tidak menutupi bilah tab.

#### 8.7.3 Header mobile

| Posisi | Elemen |
| --- | --- |
| Kiri | Judul halaman aktif (`Ringkasan`, `Item`, `Menu`) |
| Kanan | Ikon pencarian (SUPERADMIN), notifikasi, avatar |
| Tidak ada | `SidebarTrigger`, breadcrumb penuh, badge peran, tombol `Lihat situs` (pindah ke menu `Akun`/`Lainnya`) |
| Tinggi | 56px, `sticky top-0`, `border-b` |

### 8.8 Aksesibilitas dan token

- `<header role="banner">`; skip-link `Lewati ke konten` dirender sebelum header (pola sudah ada).
- Semua tombol ikon punya `aria-label` unik; target sentuh ≥ 44px.
- Notifikasi memakai `aria-live="polite"` hanya saat jumlah berubah.
- Warna hanya token: `bg-background`, `border-border`, hover `bg-muted`, fokus `focus-ring` (outline hitam + halo aqua).
- Sidebar memakai `aria-label="Navigasi Admin"` / `"Navigasi Dashboard"`; item aktif `aria-current="page"`.
- Bilah tab bawah memakai `<nav aria-label="Navigasi utama">` + `aria-current="page"`; ikon dekoratif `aria-hidden="true"`; label teks tetap terlihat; badge dibacakan sebagai "3 pesanan menunggu".
- Empat keadaan wajib: memuat (skeleton baris), kosong (`EmptyState`), error (`requestId` + `Coba lagi`), tanpa izin (`403`).

### 8.9 Komponen yang perlu dibuat

| Komponen | Basis | Isi |
| --- | --- | --- |
| `PanelHeader` | `header` + `SidebarTrigger` | Dipakai `(app)` dan `(panel)` |
| `PanelBreadcrumb` | shadcn `breadcrumb` | Turunan path, label Indonesia |
| `PanelSearch` | `command` + `dialog` | Hanya SUPERADMIN; buka dengan `⌘K`/`Ctrl+K` |
| `QuickCreateMenu` | `dropdown-menu` | Item baru, Tutorial baru, Unggah media |
| `NotificationBell` | `popover` + `badge` | Daftar notifikasi + tautan |
| `UserMenu` | `dropdown-menu` + `avatar` | Profil, Keamanan, Lihat situs, Keluar |
| `AppSidebar` | shadcn `sidebar` | Ganti `AppShell` dan nav `<details>`; hanya ≥768px |
| `MobileTabBar` | `nav` + `Link` | Bilah tab bawah 56px + safe-area; tab per peran; badge antrean |
| `MobileMenuScreen` | `Link` + `Badge` | Halaman `/superadmin/menu` bergrup untuk item di luar 4 tab |
| `MobileAccountScreen` | `Link` + `Button` | Halaman `Akun` untuk USER (profil, keamanan, lihat situs, keluar) |

### 8.10 Migrasi penamaan: `/admin` → `/superadmin`

Keputusan **A + (1)**: panel tetap ada, URL diganti; peran hanya `SUPERADMIN` dan `USER`; guest = anonim tanpa akun. Tidak ada lagi kata "admin" pada URL, label UI, nama komponen, atau tabel audit.

| Aspek | Sebelum | Sesudah |
| --- | --- | --- |
| URL panel | `/admin/*` | `/superadmin/*` |
| Redirect lama | — | `/admin/*` → `308 /superadmin/*` (path dipertahankan) |
| Route group | `src/app/(admin)/` | `src/app/(panel)/` |
| Folder rute | `src/app/(admin)/admin/` | `src/app/(panel)/superadmin/` |
| Login sukses | `303 /admin` | `303 /superadmin` |
| Redirect guard | `/admin/mfa` | `/superadmin/keamanan` |
| Menu mobile | `/admin/menu` | `/superadmin/menu` |
| Nav helper | `src/lib/admin/nav.ts`, `adminNav()` | `src/lib/panel/nav.ts`, `superadminNav()` |
| Capability map | `adminPathCapability()` | `panelPathCapability()` (hanya memeriksa SUPERADMIN) |
| Guard | `requireAdmin()`, `requireAdminRole()` | `requireSuperadmin()`, `requireSuperadminRole()` |
| Komponen | `AdminNav`, `AdminPageHeader`, `AdminFilterBar` | `SuperadminNav`, `PanelPageHeader`, `PanelFilterBar` |
| Tabel audit | `AdminAuditLog` / `admin_audit_logs` | `AuditLog` / `audit_logs` |
| Env seed | `SEED_ADMIN_PIN` | `SEED_SUPERADMIN_PIN` |
| Akun seed | `admin@reditech.id` | `superadmin@reditech.id` |
| Test | `admin-auth.spec`, `admin-content.spec` | `superadmin-auth.spec`, `superadmin-content.spec` |
| Proxy | `ADMIN_PATH = /^\/admin(\/|$)/` | `PANEL_PATH = /^\/superadmin(\/|$)/` |
| Robots | `Disallow: /admin` | `Disallow: /superadmin` |
| Dokumen | `prd/09-superadmin-admin.md` | `prd/09-panel-superadmin.md` (semua tautan diperbarui) |
| Label UI | "Admin", "Superadmin" di badge | "Panel" untuk area; badge peran hanya `Superadmin` |

Catatan:

- Redirect `/admin/*` → `/superadmin/*` memakai `308` dan mempertahankan path + query, sehingga bookmark lama tetap hidup.
- `robots.txt` dan `X-Robots-Tag` memakai prefix baru; `/admin` lama tetap di-`Disallow` selama masa transisi (satu rilis) agar tidak diindeks.
- Nama cookie (`rd_session`) tidak berubah.
- Tidak ada perubahan pada `Order`, `Download`, `Entitlement`, `Item`, atau `Media`.

---

## 9. Revisi Ringkasan (statistik & grafik)

Berlaku hanya untuk **SUPERADMIN** di `/superadmin` dan **USER** di `/dashboard`. Tidak ada peran `ADMIN`.

### 9.1 Prinsip

1. **Angka dulu, grafik kemudian.** Grafik pendapatan baru dapat diuji setelah DOKU terpasang (M5); membangunnya lebih awal hanya menghasilkan grafik kosong.
2. PRD v1 **tidak memasang komponen `chart`** (`10-design-tokens.md` §10, `11-component-inventory.md` §15). Token `--chart-1..5` sudah ada, tetapi `chart.tsx`/recharts belum.
3. Aqua `#58d3db` hanya **1,79:1** di atas putih, jadi tidak boleh menjadi satu-satunya pembeda segmen grafik. Wajib ada label langsung, garis, atau pola.
4. Semua angka berasal dari query nyata (bukan hardcode), dengan `Cache-Control: no-store` untuk halaman panel.

### 9.2 Ringkasan `/superadmin` — fase sekarang (data sudah tersedia)

| Blok | Isi | Sumber |
| --- | --- | --- |
| 4 kartu KPI | Unduhan hari ini (gratis/premium), unduhan 7 hari, item terbit, item perlu perhatian | `Download`, `Item` |
| Kesehatan konten | Premium tanpa berkas terverifikasi, item 0 unduhan 30 hari, slug bentrok | `Item` |
| Antrean | Sponsor `PENDING_REVIEW`, usulan `NEW` (sementara 0) | `Sponsor`, `AppRequest` |
| Storage | Total ukuran berkas item + media | `Item.driveFileSize`, `Media.bytes` |
| Aktivitas | 10 unduhan terakhir (item, jalur, hasil) | `Download` |

Tanpa grafik. Semua blok dapat diuji hari ini.

### 9.3 Ringkasan `/superadmin` — setelah M5 (order & uang tersedia)

| Blok | Isi |
| --- | --- |
| 4 kartu KPI | Pendapatan 30 hari (+delta vs 30 hari sebelumnya), pesanan lunas 30 hari, pesanan perlu tindakan (`PENDING` > 30 menit), webhook gagal 24 jam |
| Grafik A | **Bar 14 hari**: pendapatan dan jumlah order (dua seri) |
| Grafik B | **Bar bertumpuk 14 hari**: unduhan gratis vs premium |
| Tabel | 5 item teratas: unduhan, pendapatan, rasio gratis→premium |
| Panel tindakan | Order tertahan, webhook gagal, refund tertunda |

### 9.4 Keputusan grafik

| # | Keputusan | Alasan |
| --- | --- | --- |
| C1 | **Tidak ada komponen chart di v1**; grafik 14 hari dibuat dengan bar CSS tanpa dependensi | Menghindari dependensi baru dan tetap terbaca tanpa JS |
| C2 | Bila nanti butuh chart interaktif: shadcn `chart` + recharts, **wajib ADR baru** karena stack frozen | Perubahan stack harus lewat ADR |
| C3 | **Tanpa pie/donut** | Porsi gratis vs premium lebih jelas sebagai dua angka + bar; kontras aqua gagal sebagai pembeda tunggal |
| C4 | Ringkasan panel dibangun **sekarang** untuk blok yang datanya ada; blok uang menyusul M5 | Menghindari grafik kosong dan pekerjaan ganda |

Bila pemilik tetap ingin donut untuk gratis vs premium: wajib label langsung + garis pemisah + tabel alternatif, dan tetap bukan satu-satunya cara membaca data.

### 9.5 Spesifikasi grafik (bila C1/C2 disetujui nanti)

| Aspek | Aturan |
| --- | --- |
| Tinggi | 160–200px; grid horizontal tipis `--border` |
| Warna | `--chart-1` (aqua) dan `--chart-2` (#00b87a); segmen dipisah garis `--foreground` 1px |
| Label | Nilai langsung di ujung bar; sumbu Y maksimum 4 tick |
| Tooltip | Opsional; bila ada, fokus keyboard dan teks ringkas |
| Alternatif teks | Tabel tersembunyi `sr-only` berisi 14 baris angka + ringkasan `aria-label` |
| Gerak | Tanpa animasi otomatis; `prefers-reduced-motion` dihormati |

### 9.6 Ringkasan `/dashboard` (USER, M4)

| Blok | Isi |
| --- | --- |
| Sapaan | `Halo, <nama depan>` (FR-DASH-02) |
| 3 kartu | Source code dimiliki, total pembelian (jumlah + nominal), unduhan 30 hari |
| Pembelian terakhir | 3 baris + tautan invoice + `Unduh` |
| Unduhan terakhir | 5 baris + `Unduh ulang` |
| Kosong | `EmptyState` + CTA katalog, tanpa grafik |

### 9.7 Komponen yang perlu dibuat

| Komponen | Basis | Catatan |
| --- | --- | --- |
| `StatCard` | `card` | sudah ada di inventaris |
| `TrendBar` | `div` + CSS | bar 14 hari, tanpa dependensi |
| `RecentActivityList` | `table`/`ul` | unduhan/order terakhir |
| `AttentionList` | `alert` + `ul` | item premium tanpa berkas, 0 unduhan |
| `ChartContainer` | — | **belum** dibuat di v1 (C1) |

### 9.8 Dampak

| Area | Perubahan |
| --- | --- |
| `02-requirements.md` | FR-ADM-20 menjadi lebih rinci; tambah catatan "tanpa chart di v1" |
| `09-panel-superadmin.md` | §5 Ringkasan diperbarui: blok fase sekarang vs M5 |
| `10-design-tokens.md` | §10 tetap "chart belum dipasang"; tambah alasan kontras aqua |
| `11-component-inventory.md` | Tambah `TrendBar`, `RecentActivityList`, `AttentionList` |
| `12-route-map.md` | `/superadmin` dan `/dashboard` tetap `no-store`; tidak ada rute baru |
| Kode | `src/app/(panel)/superadmin/page.tsx`, `src/app/(app)/dashboard/page.tsx`, `src/lib/panel/stats.ts` |

---

## 10. Dampak per kode

| Area | Berkas (perkiraan) | Perubahan |
| --- | --- | --- |
| Skema & migrasi | `prisma/schema.prisma`, `prisma/migrations/*` | Enum `Role` (tanpa ADMIN), kolom MFA → `pinHash`, hapus `AdminInvite`, `AdminAuditLog` → `AuditLog` / `audit_logs` |
| Seed | `prisma/seed.ts` | Hapus `editor@`; `admin@` → `superadmin@reditech.id`; PIN awal `123456` (hash); `pinUpdatedAt = null` |
| Auth | `src/lib/auth/*` (`totp`, `mfa`, `capabilities`, `session`) | Hapus TOTP; tambah verifikasi PIN + lockout; ganti `requireAdmin*` → `requireSuperadmin*` |
| Halaman auth | `src/app/(auth)/login`, `login/mfa`, `actions.ts` | Hapus `/login/mfa`; formulir menjadi email + PIN; sukses → `/superadmin` |
| Panel | `src/app/(panel)/superadmin/mfa`, `superadmin/ulasan`, `layout.tsx` | Hapus rute; guard cukup `requireSuperadmin()` |
| Shell panel | `src/app/(app)/layout.tsx`, `src/app/(panel)/layout.tsx`, `src/components/layout/*` | Ganti `AppShell` + nav `<details>` dengan `PanelHeader`, `AppSidebar` (≥768px), `MobileTabBar` (mobile); tanpa footer |
| Rute mobile | `src/app/(panel)/superadmin/menu/page.tsx`, `src/app/(app)/dashboard/akun/page.tsx` | Halaman menu penuh (`Lainnya`) dan halaman akun USER |
| Rename panel | seluruh `src/**` | `/admin` → `/superadmin`, `(admin)` → `(panel)`, `src/lib/admin` → `src/lib/panel`, `AdminNav`/`AdminPageHeader` → `SuperadminNav`/`PanelPageHeader` |
| Redirect | `src/proxy.ts` | `/admin/*` → `308 /superadmin/*` selama satu rilis; status 403/404/410 tetap via replay |
| Proxy | `src/proxy.ts` | Hapus cabang MFA; hapus `rd_mfa`; `PANEL_PATH`, 403 untuk `role !== SUPERADMIN` |
| Robots | `src/app/robots.ts`, `src/proxy.ts` | `Disallow: /superadmin`; `/admin` lama tetap ditutup selama transisi |
| Env | `.env.example` | Hapus `MFA_ENCRYPTION_KEY`; `SEED_ADMIN_PIN` → `SEED_SUPERADMIN_PIN` |
| Test | `tests/*` atau `e2e/*` | Hapus uji MFA; rename `admin-*.spec` → `superadmin-*.spec`; tambah uji PIN + redirect `/admin` |

---

## 11. Pertanyaan teknis tambahan

| # | Pertanyaan | Usulan default |
| --- | --- | --- |
| Q9 | Setelah ADMIN hilang, apakah `can(actor, capability)` dipertahankan? | **Diputuskan (B): dihapus.** Guard memakai `requireSuperadmin()`; `permissions.ts`, `route-capability.ts`, bundel, dan parameter kapabilitas dihapus (P-03) |
| Q10 | Apakah `Revision` dan `AuditLog` tetap? | **Diputuskan (A): keduanya tetap.** `Revision` hanya dibuat saat simpan eksplisit/terbit dan tidak menduplikasi snapshot identik; `AuditLog` append-only, retensi 24 bulan lalu arsip (P-04) |
| Q11 | Apakah `permissions String[]` dihapus? | **Diputuskan (A): dihapus** setelah laporan pra-migrasi menyimpan nilainya (P-05) |
| Q12 | PIN minimal 6 digit angka saja atau boleh alfanumerik? | **6 digit angka**, sesuai instruksi |
| Q13 | Tablet 768–1023px memakai sidebar rail atau ikut bilah tab bawah? | **Sidebar rail**; tab bawah hanya `<768px` |
| Q14 | Panel SUPERADMIN cukup 4 tab (`Ringkasan`, `Item`, `Pesanan`, `Lainnya`) atau 5? | **4 tab**; menu lain di `/superadmin/menu` agar tidak sesak |
| Q15 | Bilah tab bawah juga muncul di halaman publik? | **Tidak**; hanya di `(app)` dan `(panel)` |
| Q16 | `Lainnya` berupa halaman (`/superadmin/menu`) atau sheet? | **Halaman penuh**, agar tombol back bekerja dan tidak menutupi konten |

---

## 12. Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| PIN 6 digit tanpa MFA jauh lebih lemah daripada kata sandi + TOTP | Akun pemilik bisa diambil alih | Wajib Q3 (lockout), rate limit 10/menit, audit setiap kegagalan, alert > 5 gagal/jam |
| PIN default `123456` tertinggal di produksi | Pintu terbuka | Panel menandai "PIN masih default"; blokir akses panel sampai PIN diganti (usulan) |
| Satu-satunya SUPERADMIN terkunci | Tidak ada yang bisa mengelola situs | Prosedur darurat lewat CLI/seed (`npm run admin:reset-pin`), tercatat di runbook |
| Migrasi enum `Role` salah urutan | Data admin hilang | Migrasi bertahap: tambah nilai baru → pindahkan data → hapus nilai lama; uji di salinan DB |
| Dokumen PRD saling bertentangan | Implementasi menyimpang | Semua dokumen di §7 diperbarui dalam satu commit |

---

## 13. Acceptance criteria revisi

| ID | Kriteria |
| --- | --- |
| RV-01 | Tidak ada lagi kode, rute, env, atau dokumen yang menyebut TOTP/MFA/recovery code |
| RV-02 | Login panel selesai dalam satu langkah dan menghasilkan sesi tanpa halaman kedua |
| RV-03 | PIN default `123456` berfungsi pada instalasi baru dan ditandai "default" di panel |
| RV-04 | 5 PIN salah berturut-turut mengunci akun 15 menit (bila Q3 = a) |
| RV-05 | `USER` yang membuka `/superadmin` tetap menerima `403` |
| RV-06 | Enum `Role` hanya berisi `USER` dan `SUPERADMIN`; tidak ada baris `ADMIN` di database |
| RV-07 | Rute `/superadmin/mfa`, `/login/mfa`, dan `/superadmin/ulasan` tidak ada (atau `308`/404 sesuai Q8) |
| RV-08 | `prd/` dan `README.md` konsisten dengan perilaku baru |
| RV-09 | Di `<768px` tidak ada sidebar/drawer kiri; navigasi utama memakai bilah tab bawah yang menetap |
| RV-10 | Bilah tab bawah memiliki maksimum 5 tab, label teks, `aria-current`, dan tidak menutupi konten (safe-area + padding bawah) |
| RV-11 | Menu `Lainnya` SUPERADMIN membuka `/superadmin/menu` dan tombol back kembali ke halaman sebelumnya |
| RV-12 | Header mobile 56px tanpa trigger sidebar; pencarian/notifikasi/avatar tetap dapat dijangkau |
| RV-13 | `USER` anonim membuka `/dashboard*` → `307 /login?redirect=…` (bukan 200) |
| RV-14 | Tidak ada footer di dashboard USER maupun panel SUPERADMIN pada semua breakpoint |
| RV-15 | `GET /admin/*` → `308 /superadmin/*` dengan path dan query dipertahankan |
| RV-16 | Tidak ada "admin" pada URL, label UI, nama komponen, env, atau tabel; tabel audit bernama `audit_logs` |
| RV-17 | Guest anonim tetap dapat membuka katalog dan mengunduh gratis tanpa akun |
| RV-18 | Hanya `SUPERADMIN` mendapat `200` di `/superadmin/*`; `USER` `403`; anonim `307 /login` |

---

## 14. Yang tidak berubah

- Dua jalur unduhan, proxy Drive, token sekali pakai, kuota 5/24 jam.
- Pemisahan `Order` / `Download` / `Entitlement`.
- Model katalog, filter URL, paginasi 308, status 404/410/403 via replay proxy.
- Tema Celestial dan seluruh token desain.
- Audit log append-only dan `Revision`.
- Rencana Google OAuth untuk USER di M4.

---

## 15. Urutan eksekusi yang diusulkan (setelah diskusi)

1. Putuskan Q1–Q16.
2. Perbarui dokumen PRD (§7) dalam satu commit agar tidak ada fase kontradiktif, termasuk rename `09-panel-superadmin.md` dan semua tautan.
3. **Rename panel**: `/admin` → `/superadmin`, `(admin)` → `(panel)`, `src/lib/admin` → `src/lib/panel`, `AdminAuditLog` → `AuditLog`, seed `admin@` → `superadmin@`; pasang redirect `308` sementara.
4. Migrasi skema + seed + reset PIN.
5. Ubah auth, proxy, dan rute panel; hapus halaman MFA.
6. Bangun shell navigasi: `PanelHeader`, `AppSidebar` (≥768px), `MobileTabBar` + `/superadmin/menu` (mobile); hapus footer.
7. Ubah test: hapus uji MFA, tambah uji PIN/lockout, uji navigasi mobile, uji guard `/dashboard`, uji redirect `/admin`.
8. Perbarui `README.md` dan jalankan `lint`, `typecheck`, `test`, `build`.

---

## 16. Lampiran — Simulasi CRUD satu item (POS)

Contoh: **“Aplikasi POS Kasir Laravel”**, `PREMIUM`, `priceIdr = 149000`. Semua langkah dilakukan SUPERADMIN di panel. Alur ini adalah target, belum implementasi.

### 16.1 Prasyarat

- Login PIN → `/superadmin`.
- Media tersedia di pustaka atau diunggah saat mengisi item.

### 16.2 Langkah 1 — Media

`/superadmin/media` → `Unggah`:

| Berkas | Keterangan |
| --- | --- |
| `pos-thumbnail.webp` (1200×760) | alt "Tampilan dashboard aplikasi POS" |
| `pos-kasir-1.png`, `pos-kasir-2.png`, `pos-laporan.png` | screenshot |

Server menghitung sha256; gambar identik memakai media lama (dedup). `alt` wajib.

### 16.3 Langkah 2 — Buat item

`/superadmin/item/new`:

**Tab Dasar**

| Field | Nilai |
| --- | --- |
| Judul | Aplikasi POS Kasir Laravel |
| Slug | `aplikasi-pos-kasir-laravel-mtgs89ab` (otomatis) |
| Tipe | `PREMIUM` |
| Kategori | Laravel |
| Teknologi | PHP, Laravel, MySQL |
| Deskripsi singkat | 40–160 karakter |
| Lisensi | Premium |
| Rilis | 28 Oktober 2026 |
| Demo | `https://demo.reditech.id/pos` (https, host publik) |

**Tab Konten**: deskripsi ≥200 karakter, cara kerja, 6 fitur berurutan, 4 langkah instalasi.

**Tab Harga** (hanya SUPERADMIN): `priceIdr = 149000`; `noAdsPriceIdr = null` (INV-02).

**Tab Berkas**: `driveFileId = pos-kasir-laravel.zip` → `Uji berkas` → nama, 48 MB, izin baca OK, `driveVerifiedAt = 09:20`. Berkas 250 MB ditolak.

**Tab Galeri**: 3 screenshot, urut, screenshot pertama menjadi thumbnail.

**Tab SEO**: `seoTitle` ≤70, `seoDescription` ≤160; kosong = fallback.

### 16.4 Langkah 3 — Simpan draft

`status = DRAFT`:

| Tabel | Tulisan |
| --- | --- |
| `items` | baris baru, `publishedAt = null` |
| `revisions` | versi 1 |
| `audit_logs` | `item.create` + diff + aktor + IP + requestId |
| `media_usages` | thumbnail + 3 screenshot |

### 16.5 Langkah 4 — Gate publikasi

```
✓ Berkas terverifikasi (48 MB, 09:20)
✓ Thumbnail tersedia
✓ Screenshot minimal 1 (3)
✓ Harga valid (Rp 149.000)
✓ Deskripsi 1.240 karakter
✓ Slug unik
```

Bila ada yang gagal, tombol `Terbitkan` nonaktif dan setiap baris menaut ke tab perbaikannya.

### 16.6 Langkah 5 — Terbitkan

`status = PUBLISHED`, `publishedAt = 28 Okt 2026 09:32`, revisi v2, audit `item.publish`, `updateTag("items")` + `item:<slug>`, sitemap `lastmod`, JSON-LD `Product` aktif.

### 16.7 Langkah 6 — Baca

- `/superadmin/item`: filter status/tipe/kategori, kolom `Judul · Tipe · Harga · Status · Unduhan · Diperbarui`.
- `/superadmin/item/[id]`: tab + riwayat revisi.
- Publik: `/source-code/aplikasi-pos-kasir-laravel-mtgs89ab` (ISR 60 s); guest tidak pernah melihat tautan berkas.

### 16.8 Langkah 7 — Update

| Aksi | Hasil |
| --- | --- |
| Ubah deskripsi | revisi v3 + audit `item.update` |
| Harga 149.000 → 179.000 | `ItemPriceHistory` + audit `item.price_change`; invoice lama tidak berubah |
| Ubah slug setelah terbit | ditolak; lewat aksi khusus yang membuat baris `Redirect` `308` |
| Ubah kategori | chip katalog berubah setelah `updateTag` |

### 16.9 Langkah 8 — Delete

1. `Arsipkan` → `ARCHIVED`; hilang dari katalog; URL lama → `410`; entitlement pembeli tidak otomatis dicabut.
2. Setelah 30 hari, `Hapus permanen` aktif; wajib mengetik slug; baris + revisi dihapus, audit `item.delete` tetap.
3. Sebelum 30 hari, `Pulihkan` mengembalikan ke `DRAFT`.

### 16.10 Jalur pembeli (setelah M5)

Detail → `Beli Source Code` → email + checkout DOKU → `Order(PENDING)` → webhook `PAID` → `Entitlement` → `FULFILLED` → unduh lewat token, bukan tautan Drive.

### 16.11 Kasus gagal wajib

- Terbit tanpa berkas terverifikasi → ditolak dengan alasan per butir.
- `priceIdr` kosong pada PREMIUM → `422` + gate gagal.
- `noAdsPriceIdr` terisi pada PREMIUM → INV-02 menolak.
- Dua tab menyimpan bersamaan → konflik `updatedAt` → dialog diff.
- Media dipakai item → hapus ditolak + daftar pemakaian.

---

## 17. Revisi Pengaturan (termasuk WhatsApp Gateway)

### 17.1 Kondisi sekarang

| Hal | Kondisi |
| --- | --- |
| Halaman | `/superadmin/pengaturan` masih `RouteStub`; tidak ada form dan tidak ada Server Action |
| Data | 5 baris `settings` hasil seed (harga, iklan, kuota, kedaluwarsa) |
| Pembaca | `getSetting(key, fallback)` + `getInterstitialSeconds()`, `getDailyDownloadLimit()`, `getAdsEnabled()` |
| Aset merek/landing | Belum di-seed; belum ada UI |

### 17.2 Tab pengaturan (final)

| Tab | Isi | Status |
| --- | --- | --- |
| Identitas merek | logo terang/gelap, wordmark, favicon, ikon 192/512/maskable, OG fallback (semua `mediaId`) | belum |
| Aset landing | `landing.heroMediaId`, `landing.assets[]` slot `hero`/`fitur`/`cta`/`og-landing` | belum |
| Umum | `site.name`, `site.tagline`, `site.whatsapp` | belum |
| Harga | `pricing.noAdsPriceIdr`, `pricing.serviceFeeIdr` | belum |
| Pembayaran | `payment.provider`, `payment.expiryMinutes` | belum |
| Iklan | `ads.enabled`, `ads.interstitialSeconds`, `ads.adsenseClient` | belum |
| **WhatsApp** | nomor, gateway, tombol **Konekkan**, status, uji pesan | **baru** |
| Email | `email.fromAddress`, `email.replyTo` | belum |
| SEO | `seo.defaultTitle`, `seo.defaultDescription`, `seo.robots` | belum |
| Keamanan | `security.downloadDailyLimit`, `security.pinMaxAttempts`, `security.pinLockMinutes`, `security.requirePinChange`, `security.sessionIdleMinutes`, tombol **Ganti PIN** | belum |

Kunci `security.requireMfaForAdmin` dihapus (MFA sudah tidak ada).

### 17.3 Form WhatsApp

Gateway yang sudah tersedia: **`https://wassap.reditech.id`**.

```
┌─ WhatsApp ───────────────────────────────────────────────┐
│ Kirim notifikasi ke nomor pemilik lewat gateway Reditech. │
│                                                          │
│ Nomor WhatsApp                                           │
│ ┌──────────────────────────────────────┐                 │
│ │ +62 812 3456 7890                    │                 │
│ └──────────────────────────────────────┘                 │
│ Nomor diawali 62, tanpa spasi/tanda hubung.              │
│                                                          │
│ URL gateway                                              │
│ ┌──────────────────────────────────────┐                 │
│ │ https://wassap.reditech.id           │  (read-only)    │
│ └──────────────────────────────────────┘                 │
│                                                          │
│ Status: ● Terhubung sejak 28 Okt 09:41                   │
│                                                          │
│ [ Konekkan ]   [ Kirim pesan uji ]   [ Putuskan ]        │
└──────────────────────────────────────────────────────────┘
```

Kondisi menunggu pindai:

```
Status: ○ Menunggu pindai — QR berlaku 45 detik

        ┌──────────────────┐
        │                  │
        │   [ QR CODE ]    │
        │                  │
        └──────────────────┘

Buka WhatsApp → Pengaturan → Perangkat tertaut → Tautkan perangkat.
Jangan bagikan kode ini.                    [ Konekkan ulang ]
```

| Field | Key | Wajib | Aturan |
| --- | --- | --- | --- |
| Nomor WhatsApp | `whatsapp.phoneNumber` | ya | dinormalkan ke E.164 `+62…`; `08…` diubah ke `+62…`; hanya 9–15 digit |
| URL gateway | `whatsapp.gatewayUrl` | ya | default `https://wassap.reditech.id`; **https saja**, host allowlist |
| Label perangkat | `whatsapp.sessionLabel` | tidak | default `Reditech` |
| Aktif | `whatsapp.enabled` | ya | default `false` sampai status `CONNECTED` |
| API key | env `WHATSAPP_GATEWAY_API_KEY` | ya | **tidak pernah** dikirim ke klien atau ditulis ke log |

Status dan metadata (disimpan di `settings`):

| Key | Nilai |
| --- | --- |
| `whatsapp.status` | `DISCONNECTED` / `PENDING` / `CONNECTED` / `ERROR` |
| `whatsapp.sessionId` | id sesi dari gateway |
| `whatsapp.connectedAt` | ISO time |
| `whatsapp.lastError` | teks singkat, tanpa rahasia |

### 17.4 Alur Konekkan

1. SUPERADMIN membuka tab **WhatsApp**, mengisi nomor, klik **Konekkan**.
2. Server Action `whatsapp.connect` memvalidasi nomor + allowlist URL, lalu memanggil gateway dengan API key.
3. Gateway mengembalikan **QR** (data URL). Panel menampilkan QR + hitung mundur 60 detik; pengguna memindai lewat WhatsApp → Perangkat tertaut. Panel memanggil `whatsapp.status` tiap **5 detik** sampai `CONNECTED`, `ERROR`, atau QR kedaluwarsa.
   - QR dirender sebagai gambar di dalam panel, bukan iframe/domain pihak ketiga.
   - QR tidak boleh di-cache, tidak dikirim ke analitik, dan tidak dicatat di log.
   - Bila kedaluwarsa: tampilkan `Konekkan ulang` yang meminta QR baru (bukan memakai QR lama).
4. Bila berhasil: `whatsapp.status = CONNECTED`, `connectedAt`, `enabled = true`, audit `whatsapp.connect`.
5. **Putuskan**: `whatsapp.disconnect` memanggil logout gateway, status `DISCONNECTED`, `enabled = false`, audit `whatsapp.disconnect`.
6. **Kirim pesan uji**: `whatsapp.test` mengirim pesan ke nomor yang sama; hasil dicatat di `EmailLog`-setara, yaitu `WhatsappLog` (lihat 17.5).

Kegagalan:

| Kode | Arti |
| --- | --- |
| `400 INVALID_PHONE` | nomor tidak valid setelah normalisasi |
| `409 ALREADY_CONNECTED` | sesi lain masih aktif |
| `410 QR_EXPIRED` | QR kedaluwarsa; tampilkan tombol `Konekkan ulang` |
| `503 GATEWAY_UNREACHABLE` | gateway tidak merespons dalam 10 detik |
| `502 GATEWAY_REJECTED` | gateway menolak API key atau payload |

### 17.5 Skema tambahan

```prisma
model WhatsappLog {
  id        String   @id @default(cuid())
  to        String   @db.VarChar(20)
  template  String   @db.VarChar(60)   // test, order_paid, webhook_failed, ...
  status    String   @db.VarChar(20)   // QUEUED, SENT, FAILED
  providerId String?                   // id pesan dari gateway
  error     String?
  createdAt DateTime @default(now())

  @@index([to, createdAt(sort: Desc)])
  @@map("whatsapp_logs")
}
```

Tidak ada pesan masuk yang disimpan di v1; gateway hanya dipakai untuk **notifikasi keluar**.

### 17.6 Keamanan

| Risiko | Mitigasi |
| --- | --- |
| SSRF lewat `gatewayUrl` | Hanya host allowlist (`wassap.reditech.id`), https, tanpa redirect; tolak host privat/loopback |
| API key bocor | Disimpan di env, tidak dirender, tidak dilog, tidak masuk `settings` |
| Spam pesan uji | Rate limit 5/menit per aktor; audit setiap kirim |
| Nomor salah | Normalisasi + validasi sebelum memanggil gateway; pesan uji wajib sebelum `enabled = true` |
| Sesi terbuka di perangkat lain | Tombol `Putuskan` + audit; status dicek ulang tiap 60 detik di background job |
| QR difoto/dibagikan | Peringatan teks di dekat QR ("Jangan bagikan kode ini"); QR berumur 60 detik dan sekali pakai |

### 17.7 Pertanyaan terbuka

| # | Pertanyaan | Usulan default |
| --- | --- | --- |
| Q17 | Kontrak API `wassap.reditech.id` (endpoint connect, status, logout, auth header) | Perlu dokumentasi gateway; usulan: `POST /sessions`, `GET /sessions/:id`, `DELETE /sessions/:id` |
| Q18 | Gateway memakai QR scan atau pairing code? | **QR scan** (diputuskan); tanpa pairing code |
| Q19 | API key disimpan di env atau terenkripsi di DB? | **Env** (`WHATSAPP_GATEWAY_API_KEY`) |
| Q20 | Apakah gateway mengirim webhook status? | Bila ada, tambah `/api/webhooks/whatsapp` dengan HMAC; bila tidak, polling 5 detik |
| Q21 | Notifikasi apa yang dikirim lewat WhatsApp di v1? | `order_paid` ke pemilik, `webhook_failed`, request baru; pesan ke pembeli ditunda |
| Q22 | Apakah nomor boleh lebih dari satu? | **Satu** nomor untuk v1 |

### 17.8 Acceptance criteria

| ID | Kriteria |
| --- | --- |
| RV-19 | Tab WhatsApp punya input nomor + tombol `Konekkan`; gateway default `https://wassap.reditech.id` |
| RV-20 | Koneksi berhasil menampilkan `CONNECTED` + waktu koneksi; gagal menampilkan sebab yang dapat dibaca |
| RV-21 | `Putuskan` menutup sesi di gateway dan mengubah status + audit |
| RV-22 | API key tidak muncul di HTML, respons JSON, maupun log |
| RV-23 | Nomor `08…` dinormalkan ke `+62…`; nomor tidak valid ditolak tanpa memanggil gateway |
| RV-24 | Polling status berhenti saat `CONNECTED`/`ERROR` dan saat tab ditinggalkan |
| RV-25 | Perubahan pengaturan menulis `Revision` + `AuditLog` dan memanggil `revalidateTag("settings")` |
| RV-26 | QR ditampilkan di panel dengan masa berlaku 60 detik, dapat diperbarui lewat `Konekkan ulang`, dan tidak pernah masuk cache/log/analitik |

### 17.9 Dampak

| Area | Perubahan |
| --- | --- |
| `02-requirements.md` | FR-ADM-14 diperluas; tambah FR-ADM-22 (WhatsApp gateway) |
| `03-data-model.md` | Kunci `whatsapp.*` di §2.2; model `WhatsappLog` |
| `04-api-spec.md` | Server Action `whatsapp.connect/status/disconnect/test`; opsional webhook |
| `08-deployment.md` | Env `WHATSAPP_GATEWAY_URL`, `WHATSAPP_GATEWAY_API_KEY`; alert gateway mati |
| `09-panel-superadmin.md` | §6.11 tab WhatsApp |
| `11-component-inventory.md` | `WhatsappConnectCard`, `ConnectionStatus` |
| `12-route-map.md` | `/superadmin/pengaturan?tab=whatsapp`; tidak ada rute publik baru |
| Kode | `src/app/(panel)/superadmin/pengaturan/`, `src/lib/whatsapp/*` |

---

## 18. Mode Unduhan: Proxy vs Tautan Langsung (opsional)

### 18.1 Keputusan

CRUD item mendapat **pilihan sumber berkas** per item:

| Mode | Perilaku | Default |
| --- | --- | --- |
| `PROXY` | Berkas dibaca server dari Drive/lokal lalu dialirkan ke pengguna; tautan penyimpanan tidak pernah diekspos (ADR-001) | **Ya** |
| `EXTERNAL_LINK` | Item menyimpan URL Drive/pihak ketiga yang sudah siap diunduh; server hanya mengalihkan (`302`) setelah gate/entitlement | Opsional, dipilih sadar per item |

Tujuannya: mengurangi **bandwidth keluar VPS** dan beban proxy saat berkas besar atau banyak unduhan. Catatan penting: pada produksi berkas source code **tidak** disimpan di disk VPS (ada di Drive), jadi yang diringankan adalah bandwidth/CPU proxy, bukan kapasitas disk. Disk VPS baru terpakai bila `STORAGE_DRIVER=local`.

### 18.2 Konsekuensi yang harus diterima

| Aspek | `PROXY` | `EXTERNAL_LINK` |
| --- | --- | --- |
| Bandwidth VPS | Terpakai | Tidak terpakai |
| Audit unduhan | Lengkap (`bytesSent` terisi) | Hanya “tautan diterbitkan”, penyelesaian tidak diketahui |
| Cabut akses | Segera (token mati) | **Tidak bisa** — tautan sudah dipegang pengguna |
| Pembagian tautan | Sulit (token 5 menit) | Mudah; siapa pun yang punya tautan bisa mengunduh |
| Risiko ToS Drive | Sama | Lebih tinggi |
| Ketergantungan | Server + Drive | Drive/pihak ketiga |
| Kuota/rate limit | Ditegakkan | Hanya dicatat, tidak dapat dicegah |

Karena itu: `EXTERNAL_LINK` **boleh dipakai untuk item gratis maupun premium** (Q23 = boleh), tetapi UI wajib menampilkan peringatan sebelum disimpan. Untuk premium, risiko “satu pembeli membagikan tautan” diterima secara sadar; entitlement hanya diperiksa **sebelum** redirect, tidak setelah tautan dipegang pengguna.

### 18.3 Perubahan skema

```prisma
enum DownloadMode {
  PROXY
  EXTERNAL_LINK
}

enum DownloadDelivery {
  STREAM
  REDIRECT
}

model Item {
  downloadMode   DownloadMode      @default(PROXY)
  externalUrl    String?           // wajib bila EXTERNAL_LINK
  externalHost   String?           // host hasil validasi
  linkCheckedAt  DateTime?         // validasi terakhir
  // driveFileId tetap dipakai untuk PROXY
}

model Download {
  delivery DownloadDelivery @default(STREAM)
}
```

Invariant baru:

- `downloadMode = EXTERNAL_LINK` ⇒ `externalUrl` tidak null, host ada di allowlist, dan `linkCheckedAt` < 7 hari.
- `downloadMode = PROXY` ⇒ `externalUrl` null; `driveFileId` wajib untuk `PUBLISHED`.
- `downloadMode = EXTERNAL_LINK` berlaku untuk `FREE` dan `PREMIUM`; untuk `PREMIUM`, entitlement diperiksa setiap kali redirect diterbitkan.

### 18.4 Alur di CRUD (tab Berkas)

```
Sumber berkas
( ) Upload ke Drive Reditech — diproteksi, tautan tidak pernah dibagikan
(•) Tautan langsung — pengguna diarahkan ke Drive/pihak ketiga

URL tautan
┌──────────────────────────────────────────────────────┐
│ https://drive.google.com/file/d/1AbC…/view            │
└──────────────────────────────────────────────────────┘
[ Validasi tautan ]

⚠ Tautan langsung dapat dibagikan bebas dan akses tidak dapat
  dicabut setelah pengguna menyimpannya.
```

Tombol **Validasi tautan**:

1. Hanya `https`, tanpa shortener (bit.ly, sfl.gl, dan sejenisnya).
2. **Allowlist bawaan** (dapat divalidasi otomatis): `drive.google.com`, `docs.google.com`, `dropbox.com`, `mega.nz`, `mediafire.com`, `onedrive.live.com`, `1drv.ms`, `github.com`, `gitlab.com`, `sourceforge.net`.
3. **Host lain diizinkan** (Q24 = ya) sebagai *host kustom* per item: SUPERADMIN menambahkan host, sistem hanya memvalidasi sintaks URL (tanpa `fetch`, untuk menghindari SSRF) dan menandainya “belum diverifikasi otomatis”. Tombol `Buka tautan` membuka di tab baru agar diperiksa manual.
4. Untuk host allowlist: `HEAD`/`GET` ringkas, timeout 10 detik, tolak 4xx/5xx, host privat/loopback, dan redirect ke IP privat.
5. Simpan `externalHost` + `linkCheckedAt`; publikasi ditolak bila validasi allowlist > 7 hari (host kustom: wajib konfirmasi manual setiap publikasi).
6. Tampilkan nama berkas + ukuran bila header tersedia (opsional).

### 18.5 Alur unduhan

`GET /api/download/[slug]`:

| Kondisi | Hasil |
| --- | --- |
| `PROXY` | Seperti sekarang: gate iklan/entitlement → token → stream |
| `EXTERNAL_LINK`, gratis | Gate iklan → token → `GET /api/download/file/[token]` → **`302` ke `externalUrl`** |
| `EXTERNAL_LINK`, premium | Entitlement aktif → `302` ke `externalUrl`; tanpa entitlement → `403 NO_ENTITLEMENT` |
| Item `ARCHIVED` | `410`, termasuk tautan eksternal |
| Tautan kedaluwarsa/ditolak host | `502`/`503` + catat `Download(ERROR)` |

Header pada respons redirect: `Cache-Control: private, no-store`, `Referrer-Policy: no-referrer`, `X-Download-Purpose`.

`Download` dicatat dengan `delivery = REDIRECT`, `bytesSent = null`, `result = GRANTED` (artinya tautan diterbitkan, bukan berkas selesai diunduh). UI riwayat menandai “dialihkan ke penyimpanan eksternal”.

### 18.6 Ringkasan Storage

- Kartu Storage hanya menghitung item `PROXY` (`SUM(items.driveFileSize)` + `SUM(media.bytes)`).
- Item `EXTERNAL_LINK` ditampilkan terpisah: “12 tautan eksternal — tidak dihitung”.
- Item dengan mode campuran tidak ada; satu item satu mode.

### 18.7 Peringatan dan dokumentasi

- ADR-001 tetap menjadi default. `EXTERNAL_LINK` dicatat sebagai **pengecualian sadar** lewat ADR baru (usulan ADR-013) yang menyebut risiko pembagian tautan dan hilangnya pencabutan akses.
- Halaman detail item menampilkan catatan kecil “Berkas disediakan lewat penyimpanan eksternal” bila mode ini dipakai.
- Kebijakan privasi/S&K menyebut bahwa unduhan dapat dialihkan ke penyedia eksternal dan tunduk pada ketentuan penyedia tersebut.

### 18.8 Pertanyaan terbuka

| # | Pertanyaan | Usulan default |
| --- | --- | --- |
| Q23 | Item **premium** boleh memakai `EXTERNAL_LINK`? | **Boleh** (diputuskan); entitlement diperiksa sebelum redirect, risiko pembagian tautan diterima |
| Q24 | Host allowlist | **Ya, host lain diizinkan** (diputuskan): allowlist bawaan divalidasi otomatis, host kustom hanya sintaks + konfirmasi manual |
| Q25 | Gate iklan tetap berlaku untuk tautan eksternal gratis? | **Ya** (diputuskan): interstisial + `dl_gate` + token + kuota tetap berlaku sebelum `302` |
| Q26 | Validasi tautan perlu diperbarui berapa lama? | 7 hari; publikasi ditolak bila lebih |
| Q27 | Bila tautan mati, apa yang terjadi? | `502` + email/notifikasi SUPERADMIN + item ditandai “tautan bermasalah” |

### 18.9 Acceptance criteria

| ID | Kriteria |
| --- | --- |
| RV-27 | Item lama tetap `PROXY` setelah migrasi; tidak ada perubahan URL publik |
| RV-28 | `EXTERNAL_LINK` hanya bisa disimpan setelah validasi host + https berhasil |
| RV-29 | HTML halaman item tidak pernah memuat `externalUrl`; URL hanya muncul pada `302` |
| RV-30 | Item premium `EXTERNAL_LINK` hanya redirect bila entitlement aktif; tanpa entitlement `403` |
| RV-31 | `Download.delivery = REDIRECT` tercatat dan riwayat menandainya |
| RV-32 | Kartu Storage mengecualikan item `EXTERNAL_LINK` dan menampilkannya terpisah |
| RV-33 | Tautan mati menghasilkan `502` + notifikasi, bukan halaman 500 |
| RV-34 | Item gratis `EXTERNAL_LINK` tetap melewati interstisial iklan, cookie `dl_gate`, token, dan kuota 5/24 jam sebelum `302` |

### 18.10 Dampak

| Area | Perubahan |
| --- | --- |
| `00-tech-stack.md` | ADR-013: mode tautan langsung sebagai pengecualian ADR-001 |
| `02-requirements.md` | FR-DL-12..15 (mode unduhan, validasi tautan, notifikasi tautan mati) |
| `03-data-model.md` | `DownloadMode`, `DownloadDelivery`, kolom item, invariant |
| `04-api-spec.md` | `302` ke tautan eksternal, header `Referrer-Policy`, error `502` |
| `06-milestones.md` | Masuk M3 fase 2 (CRUD item) + job cek tautan di M7 |
| `09-panel-superadmin.md` | Tab Berkas: radio sumber + Validasi tautan + peringatan |
| `11-component-inventory.md` | `DownloadSourceField`, `ExternalLinkValidator` |
| `12-route-map.md` | Tidak ada rute baru; perilaku `/api/download/file/[token]` bertambah |
| Kode | `src/lib/downloads/*`, `src/lib/storage/*`, `src/app/(panel)/superadmin/item/*` |

---

## 19. Akun & Keamanan (setelah keputusan Q1, Q4, Q5)

### 19.1 Keputusan yang mengikat

| # | Keputusan |
| --- | --- |
| A-01 | Login SUPERADMIN: **email + PIN** dalam satu langkah (Q1 = b) |
| A-02 | SUPERADMIN **tidak** memakai Google OAuth; bila akun SUPERADMIN mencoba OAuth, permintaan ditolak + audit (Q4 = b) |
| A-03 | Hanya **satu akun panel**; tidak ada undangan, tidak ada peran kedua (Q5 = a) |
| A-04 | Pemulihan hanya lewat CLI di server, bukan UI |
| A-05 | USER tetap memakai Google OAuth (baru) atau kata sandi (akun lama) |

### 19.2 Permukaan akun

**USER** — `/dashboard/profile` dan `/dashboard/profile/keamanan`

| Bagian | Isi | Aturan |
| --- | --- | --- |
| Profil | Nama tampilan | Dapat diubah; sapaan dashboard ikut berubah (FR-AUTH-04) |
| Email | Read-only | "Dikelola Google"; tidak dapat diganti |
| Avatar | Dari Google | Read-only |
| Ganti kata sandi | Hanya bila `passwordHash` ada | Akun Google melihat paragraf penjelasan, bukan form disabled |
| Koneksi | Status "Terhubung dengan Google" | Tanpa tombol putuskan di v1 |
| Sesi aktif | Perangkat, IP hash, terakhir aktif | `Akhiri sesi` per baris + `Keluar dari semua perangkat` |
| Hapus akun | Permintaan | Anonimisasi `deleted+<id>@invalid`; baris tetap untuk audit |

Tanpa MFA dan tanpa recovery code.

**SUPERADMIN** — `/superadmin/keamanan` (pengganti `/superadmin/mfa`)

| Bagian | Isi |
| --- | --- |
| Ganti PIN | PIN lama → PIN baru (6 digit) → konfirmasi; hash `scrypt`, `pinUpdatedAt` diperbarui |
| Status PIN | Badge **"Masih default"**; bila `security.requirePinChange=true`, panel memaksa ganti sebelum halaman lain |
| Sesi panel | Daftar sesi aktif, `Akhiri sesi`, `Keluar dari semua` |
| Riwayat masuk | 10 percobaan terakhir (`auth.login`, `auth.login.failed`) + IP hash + waktu |
| Koneksi Google | **Tidak ada**; akun pemilik selalu PIN |
| Darurat | Penjelasan reset lewat CLI, bukan UI |

### 19.3 Tab Keamanan di `/superadmin/pengaturan`

| Key | Default | Fungsi |
| --- | --- | --- |
| `security.downloadDailyLimit` | 5 | Kuota unduhan per item/24 jam |
| `security.pinMaxAttempts` | 5 | Jumlah gagal sebelum akun dikunci |
| `security.pinLockMinutes` | 15 | Lama kunci |
| `security.requirePinChange` | true | Wajib ganti PIN default sebelum masuk panel |
| `security.sessionIdleMinutes` | 480 | Idle timeout panel (8 jam) |

`security.requireMfaForAdmin` dihapus.

### 19.4 Aturan autentikasi

| Aktor | Masuk | Sesi | Catatan |
| --- | --- | --- | --- |
| Guest | — | — | Tanpa akun |
| USER | Google (baru) / kata sandi (akun lama) | 30 hari, `rd_session` httpOnly | Suspended → semua sesi dicabut |
| SUPERADMIN | email + PIN | 8 jam absolut + idle 8 jam | Lockout PIN; audit setiap gagal; tanpa OAuth |

Aturan tambahan:

1. PIN dinormalkan 6 digit angka; input `123456` diterima, `12345`/`1234567` ditolak.
2. Pesan gagal selalu generik ("Email atau PIN salah") — tidak membocorkan email terdaftar.
3. 5 kegagalan berturut-turut → `pinLockedUntil = now + 15 menit`; percobaan saat terkunci tetap dicatat.
4. Setiap login sukses memutar `sessionToken` baru; sesi lama tetap valid sampai kedaluwarsa atau dicabut.
5. `AuditLog`: `auth.login`, `auth.login.failed`, `auth.logout`, `auth.pin.changed`, `auth.session.revoked`.
6. OAuth callback menolak `role = SUPERADMIN` dengan pesan "Akun pemilik masuk dengan PIN" + audit `auth.oauth.denied`.

### 19.5 Pemulihan darurat

```
npm run superadmin:reset-pin -- --email superadmin@reditech.id
```

- Menghasilkan PIN sementara acak 6 digit, ditampilkan **sekali** di terminal.
- `pinUpdatedAt = null` dan `security.requirePinChange` memaksa ganti saat login berikutnya.
- Menulis `AuditLog` dengan aktor `cli` dan aksi `system.pin_reset`.
- Tidak mengirim email, tidak membuat akun baru.
- Prosedur ini dicatat di runbook `08-deployment.md`.

### 19.6 Yang dihapus

| Hal | Alasan |
| --- | --- |
| `AdminInvite` + `/superadmin/pengguna/undang` | Hanya satu akun panel |
| `user:role:manage`, `admin.invite` | Tidak ada peran yang dikelola |
| MFA/TOTP, kode pemulihan, `rd_mfa`, `rd_stepup` | Diganti PIN |
| `security.requireMfaForAdmin` | Tidak relevan |

### 19.7 Acceptance criteria

| ID | Kriteria |
| --- | --- |
| RV-35 | Login panel selesai dengan email + PIN dalam satu langkah; pesan gagal generik |
| RV-36 | 5 PIN salah → kunci 15 menit, audit + alert; percobaan saat terkunci ditolak |
| RV-37 | Bila PIN masih default dan `requirePinChange=true`, semua rute panel dialihkan ke `/superadmin/keamanan` |
| RV-38 | OAuth untuk akun SUPERADMIN ditolak dan tercatat `auth.oauth.denied` |
| RV-39 | Tidak ada rute/aksi/entitas undangan; `AdminInvite` tidak ada di skema |
| RV-40 | SUPERADMIN dapat mencabut satu sesi atau semua sesi; sesi yang dicabut langsung 307 |
| RV-41 | Reset PIN via CLI menulis `system.pin_reset` dan memaksa ganti PIN |
| RV-42 | USER: email disabled, ganti kata sandi hanya untuk akun lokal, suspend mencabut semua sesi |

### 19.8 Dampak

| Area | Perubahan |
| --- | --- |
| `02-requirements.md` | FR-AUTH-01..09 ditulis ulang (tanpa MFA, tambah PIN + lockout); hapus FR-ADM-13 bagian undangan |
| `03-data-model.md` | `User.pinHash/pinUpdatedAt/failedPinCount/pinLockedUntil`; hapus `AdminInvite`, kolom MFA |
| `04-api-spec.md` | Aksi `loginAction` (email + PIN), `pin.change`, `session.revoke`; hapus aksi MFA/undangan |
| `05-ux-flows.md` | S05 satu langkah; F5, F6, F7, F12 diperbarui; S20 + `/superadmin/keamanan` |
| `06-milestones.md` | M3: login PIN + lockout; M4: profil/sesi USER |
| `07-test-plan.md` | Uji PIN (valid, salah, kunci, ganti, default), uji OAuth ditolak untuk SUPERADMIN |
| `08-deployment.md` | Env `SEED_SUPERADMIN_PIN`; runbook reset PIN; hapus `MFA_ENCRYPTION_KEY` |
| `09-panel-superadmin.md` | §8 keamanan panel diganti aturan PIN; hapus undangan |
| `11-component-inventory.md` | `PinChangeForm`, `SessionList`; hapus `MfaSetup`, `PermissionEditor` |
| `12-route-map.md` | `/superadmin/keamanan`; hapus `/superadmin/mfa`, `/login/mfa`, `/superadmin/ulasan` |
| Kode | `src/lib/auth/*`, `src/app/(auth)/login`, `src/app/(panel)/superadmin/keamanan`, `src/proxy.ts` |
