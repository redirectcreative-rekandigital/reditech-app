# tasks.md — Peta Implementasi Reditech

| Field | Isi |
| --- | --- |
| Tujuan | Daftar tugas per file untuk dieksekusi AI coding agent / developer |
| Sumber kebenaran | `revisi.md` (keputusan baru) di atas `prd/` (spesifikasi dasar) |
| Status dokumen | Aktif — perbarui setiap tugas selesai |
| Prinsip | Fondasi dan wadah form dulu; integrasi eksternal (DOKU, WhatsApp, email, Drive/R2) menyusul |

---

## 0. Instruksi wajib untuk AI coding agent

### 0.1 Baca dulu, sebelum menyentuh kode

| Urutan | Berkas | Yang diambil |
| --- | --- | --- |
| 1 | `AGENTS.md` | Aturan Next.js versi ini (bukan Next.js lama) |
| 2 | `revisi.md` | Keputusan terbaru: PIN, tanpa ADMIN/MFA, `/superadmin`, navigasi, settings, WhatsApp, tautan eksternal |
| 3 | `prd/00-tech-stack.md` | Stack frozen + ADR |
| 4 | `prd/01-prd.md` | Tujuan, peran, ruang lingkup |
| 5 | `prd/02-requirements.md` | ID requirement + acceptance criteria |
| 6 | `prd/03-data-model.md` | Skema, invariant, migrasi |
| 7 | `prd/04-api-spec.md` | Kontrak endpoint & error |
| 8 | `prd/05-ux-flows.md` | Layar & alur |
| 9 | `prd/09-superadmin-admin.md` | Perilaku panel (nama berkas akan menjadi `09-panel-superadmin.md`) |
| 10 | `prd/10-design-tokens.md` | Token, kontras, larangan warna |
| 11 | `prd/11-component-inventory.md` | Komponen & state wajib |
| 12 | `prd/12-route-map.md` | Rute, guard, cache, status |
| 13 | `tasks.md` (dokumen ini) | Urutan kerja |

### 0.2 ATURAN UTAMA — tanya dulu, jangan menebak

Sebelum mengerjakan tugas apa pun, jika ada satu hal yang tidak jelas:

1. **Berhenti.**
2. Ajukan pertanyaan dengan format:

```
PERTANYAAN SEBELUM IMPLEMENTASI
- Tugas: T<fase>.<nomor>
- Hal tidak jelas: <ringkas>
- Opsi: A) ... B) ...
- Usulan saya: ...
- Dampak jika salah: ...
```

3. Tunggu jawaban. **Jangan** mengimplementasikan versi tebakan lalu “diperbaiki nanti”.
4. Jika jawaban mengubah keputusan di `revisi.md`, perbarui `revisi.md` lebih dulu.

Hal yang **selalu** wajib ditanyakan (tidak boleh diasumsikan):

- Kontrak API eksternal: DOKU, `wassap.reditech.id`, SMTP/Resend, Google Drive, R2.
- Kredensial/akun yang belum tersedia.
- Perubahan skema yang menghapus atau mengganti nama kolom berisi data produksi.
- Penambahan dependensi baru di luar `package.json` saat ini.
- Perubahan label/teks yang menyangkut kebijakan (harga, refund, privasi).
- Perbedaan antara `prd/` dan `revisi.md`.

### 0.3 Perintah verifikasi (wajib hijau sebelum PR)

```bash
npm run lint
npm run typecheck
npm run build
npm run db:deploy
npm run db:seed
npm run test        # setelah T0.3 menambahkan Vitest
```

### 0.4 Aturan teknis yang mengikat

- Next.js 16: middleware ada di **`src/proxy.ts`** (bukan `middleware.ts`).
- `cacheComponents: true`: **jangan** memakai `export const revalidate`; gunakan `"use cache"` + `cacheLife`/`cacheTag`.
- `Date.now()`/`cookies()`/`headers()` saat prerender butuh `await connection()`.
- Status `403`/`410` ditentukan proxy lewat replay `status-page` yang sudah ada (`src/lib/http/status-page.ts`).
- `updateTag()` dipakai untuk perubahan yang harus terlihat seketika (kategori, item).
- Jangan menambah warna/hex baru; hanya token `prd/10-design-tokens.md`.
- Jangan menulis rahasia ke repo, log, atau HTML.
- Setiap perubahan perilaku wajib punya test.
- Satu PR = satu fase/tugas besar; jangan campur rename besar dengan fitur baru.

### 0.5 Definition of Done (berlaku semua tugas)

1. Kode lolos `lint`, `typecheck`, `build`.
2. Migrasi diuji di DB kosong **dan** salinan DB berisi data.
3. Empat keadaan UI ada: memuat, kosong, error, tanpa izin.
4. Keyboard + nama aksesibilitas diperiksa.
5. Audit log ditulis untuk aksi tulis.
6. Dokumentasi terkait (`prd/`, `README.md`, `revisi.md`) diperbarui.
7. Status tugas di `tasks.md` diperbarui.

### 0.6 Legenda status

`[ ]` belum · `[~]` dikerjakan · `[x]` selesai · `[!]` terblokir pertanyaan

---

## 1. Ringkasan fase

| Fase | Nama | Estimasi | Ketergantungan |
| --- | --- | --- | --- |
| 0 | Persiapan | 1–2 pd | — |
| 1 | Rename panel + PIN | 5 pd | Fase 0 |
| 2 | Shell navigasi (desktop + mobile app-like) | 4 pd | Fase 1 |
| 3 | Media library | 3 pd | Fase 2 |
| 4 | CRUD Item + gate publikasi | 6 pd | Fase 3 |
| 5 | Wadah Pengaturan (semua tab + WhatsApp form) | 5 pd | Fase 2, 3 |
| 6 | Wadah konten lain (tutorial, sponsor, request, pengguna, pesanan, audit) | 6 pd | Fase 4 |
| 7 | Mode tautan eksternal | 2 pd | Fase 4 |
| 8 | Integrasi (DOKU, WA aktif, email, Drive/R2) | terpisah | Keputusan bisnis |
| | **Total sampai Fase 7** | **±32 pd** | |

---

## 2. Daftar pertanyaan (urut implementasi)

Cara menjawab: tulis `P-01: <jawaban>` (contoh `P-01: A`). Setelah dijawab, pindahkan keputusan ke `revisi.md` dan centang di sini.

### 2.1 Sudah diputuskan — jangan ditanyakan lagi

| ID | Keputusan |
| --- | --- |
| Q1 | Login panel satu langkah: **email + PIN** |
| Q2 | PIN boleh diganti; `123456` hanya nilai awal |
| Q3 | 5 PIN salah → kunci **15 menit** |
| Q4 | SUPERADMIN **tidak** lewat Google OAuth |
| Q5 | Tanpa undangan; satu akun panel; pemulihan lewat CLI |
| Q7 | PIN disimpan sebagai hash `scrypt` |
| Q12 | PIN **6 digit angka** |
| Q18 | WhatsApp memakai **QR scan** |
| Q23 | Item premium **boleh** tautan eksternal |
| Q24 | Host di luar Google Drive **diizinkan** |
| Q25 | Item gratis bertautan eksternal **tetap lewat iklan** |

### 2.2 Belum dijawab — urut fase

#### Fase 1 — Rename panel + PIN (jawab sebelum PR-1)

| ID | Pertanyaan | Opsi | Default | File terdampak |
| --- | --- | --- | --- | --- |
| **P-01** (Q6) | Akun `ADMIN` lama di database diapakan? | A) turunkan ke `USER` B) hapus C) naikkan ke `SUPERADMIN` | **A** + audit | migrasi `users` |
| **P-02** (Q8) | `/superadmin/mfa` & `/login/mfa` diapakan? | A) hapus + redirect `308 /login` B) biarkan 404 | **A** | `proxy.ts`, `Redirect` |
| **P-03** (Q9) | `can(actor, capability)` dipertahankan? | A) ya, pembungkus tipis B) hapus, pakai `requireSuperadmin()` | **A** | `lib/auth/permissions.ts` |
| **P-04** (Q10) | `Revision` & `AuditLog` tetap? | A) tetap B) hapus | **A** | skema, panel |
| **P-05** (Q11) | Kolom `permissions String[]` dihapus? | A) hapus B) biarkan | **A** | migrasi |
| **P-06** (I-01) | Email saat login dicari case-insensitive? | A) ya, `lower(email)` B) peka huruf besar-kecil | **A** | `loginAction` |
| **P-07** (I-02) | PIN baru boleh sama dengan kata sandi lama? | A) tidak diperiksa B) tolak | **A** | `changePin` |
| **P-08** (I-03) | Sesi SUPERADMIN 8 jam: absolut atau idle? | A) keduanya 8 jam B) absolut 8 jam, idle 30 menit | **A** | `sessions.ts` |

**Sudah diputuskan:** P-01 = **A** — akun `ADMIN` diturunkan ke `USER`, sesi dicabut, undangan dihapus, audit `user.role_downgrade`, laporan pra-migrasi wajib disimpan. Rincian di `revisi.md` §4 catatan 8.

**Sudah diputuskan:** P-02 = **A** — `/login/mfa` → `308 /login` (bawa `redirect`); `/superadmin/mfa` dan `/admin/mfa` → `308 /superadmin/keamanan`; cookie `rd_mfa` dihapus. Aturan di proxy, bukan tabel `Redirect`.

**Sudah diputuskan:** P-03 = **B** — lapisan kapabilitas dihapus: `permissions.ts`, `route-capability.ts`, bundel, dan parameter kapabilitas. Guard memakai `requireSuperadmin()`; Server Action memakai `actionActor()`.

**Sudah diputuskan:** P-04 = **A** — `Revision` dan `AuditLog` dipertahankan. `Revision` hanya pada simpan eksplisit/terbit dan tidak menduplikasi snapshot identik; `AuditLog` append-only, retensi 24 bulan lalu arsip.

**Sudah diputuskan:** P-05 = **A** — kolom `permissions` dihapus setelah laporan pra-migrasi menyimpan nilainya.

**Keputusan menyeluruh:** P-05 sampai P-33 mengikuti **default/rekomendasi** yang tertulis di tabel §2.2. Implementasi dimulai dari Fase 1.

#### Fase 2 — Shell navigasi

| ID | Pertanyaan | Opsi | Default | File terdampak |
| --- | --- | --- | --- | --- |
| **P-09** (Q13) | Tablet 768–1023px pakai apa? | A) sidebar rail B) tab bawah | **A** | `app-sidebar.tsx`, `mobile-tab-bar.tsx` |
| **P-10** (Q14) | Tab bawah SUPERADMIN berapa? | A) 4: Ringkasan, Item, Pesanan, Lainnya B) 5 (+Media) | **A** | `mobile-tab-bar.tsx` |
| **P-11** (Q15) | Tab bawah muncul di halaman publik? | A) tidak B) ya | **A** | layout `(public)` |
| **P-12** (Q16) | `Lainnya` berupa apa? | A) halaman `/superadmin/menu` B) sheet | **A** | rute + komponen |

#### Fase 3 — Media

| ID | Pertanyaan | Opsi | Default | File terdampak |
| --- | --- | --- | --- | --- |
| **P-13** (I-04) | Cara membaca `width/height` gambar? | A) tambah paket `image-size` B) parsing manual C) isi dari klien | **A** (ajukan ADR/dependensi dulu) | `lib/media/upload.ts` |
| **P-14** (I-05) | Batas media? | A) 5 MB; JPEG/PNG/WebP B) lain | **A** | `api/panel/media` |

#### Fase 4 — CRUD Item

| ID | Pertanyaan | Opsi | Default | File terdampak |
| --- | --- | --- | --- | --- |
| **P-15** (I-06) | Batas item & harga? | A) berkas ≤200 MB; harga 1.000–50.000.000 B) lain | **A** | `item/schema.ts` |
| **P-16** (I-07) | Syarat deskripsi saat terbit? | A) ≥200 karakter B) ≥100 | **A** | `publish-gate.ts` |
| **P-17** (I-08) | Retensi arsip sebelum hapus permanen? | A) 30 hari B) 7 hari | **A** | `item/actions.ts`, cron |
| **P-18** (I-12) | Format slug item baru? | A) `<judul>-<8-9 acak>` B) `<judul>` saja | **A** | `lib/slug.ts` |

#### Fase 5 — Wadah Pengaturan + WhatsApp

| ID | Pertanyaan | Opsi | Default | File terdampak |
| --- | --- | --- | --- | --- |
| **P-19** (Q17) | Kontrak API `wassap.reditech.id` | A) tulis kontraknya di sini B) form dulu, integrasi nanti | **B** (tombol disabled) | `lib/whatsapp/client.ts` |
| **P-20** (Q19) | API key WhatsApp disimpan di mana? | A) env B) DB terenkripsi | **A** | `.env.example` |
| **P-21** (Q20) | Gateway mengirim webhook status? | A) ya B) tidak, polling | **B** | `lib/whatsapp/*` |
| **P-22** (Q21) | Notifikasi WhatsApp v1 | A) pemilik: order paid, webhook gagal, request baru B) semua pihak | **A** | `lib/whatsapp/templates` |
| **P-23** (Q22) | Jumlah nomor | A) satu B) banyak | **A** | skema/settings |

#### Fase 7 — Tautan eksternal

| ID | Pertanyaan | Opsi | Default | File terdampak |
| --- | --- | --- | --- | --- |
| **P-24** (Q26) | Validasi tautan berlaku berapa lama? | A) 7 hari B) 30 hari | **A** | `external-link.ts` |
| **P-25** (Q27) | Tautan mati diapakan? | A) `502` + alert + tandai item B) `404` | **A** | `downloads/redirect.ts` |
| **P-26** (I-09) | Allowlist host final | A) daftar `revisi.md` §18.4 B) tambah host lain | **A** | `external-link.ts` |

#### Fase 8 — Bisnis & integrasi (tidak memblokir Fase 1–7)

| ID | Pertanyaan | Opsi | Default | Terdampak |
| --- | --- | --- | --- | --- |
| **P-27** (I-10) | DOKU: metode, fee, sandbox | isi kontrak | **tunda** | checkout |
| **P-28** (I-11) | Email provider | Resend/SMTP | **tunda** | email |
| **P-29** (I-13) | Kredensial Drive & R2 | isi | **tunda** (pakai `local`) | storage |
| **P-30** | Guest checkout premium? | A) ya B) wajib login | **A** (PRD Q4) | checkout |
| **P-31** | Refund | A) manual SUPERADMIN B) otomatis | **A** | panel pesanan |
| **P-32** | Harga "tanpa iklan" | A) Rp 3.000 dari setting B) lain | **A** | settings |
| **P-33** | Invoice | A) HTML + print B) PDF | **A** | invoice |

### 2.3 Aturan pertanyaan baru

Jika saat implementasi muncul hal yang belum tercantum:

1. Tambahkan baris baru di §2.2 dengan ID berikutnya.
2. Ajukan ke pemilik sebelum menulis kode.
3. Jangan mengubah kode berdasarkan asumsi yang belum dijawab.

---

## 3. Fase 0 — Persiapan

### T0.1 Sinkronkan dokumen PRD

| File | Aksi |
| --- | --- |
| `prd/01-prd.md` | Hapus kolom ADMIN, MFA; ganti `/admin` → `/superadmin`; tutup Q9 |
| `prd/02-requirements.md` | FR-AUTH-08/09 → PIN; hapus FR-ADM-05/13/19/05; tambah FR WhatsApp & tautan eksternal |
| `prd/03-data-model.md` | `Role`, `pinHash`, `AuditLog`, `DownloadMode`, `WhatsappLog`; hapus `AdminInvite`, kolom MFA |
| `prd/04-api-spec.md` | Aksi auth PIN; hapus aksi MFA/undangan; `302` tautan eksternal |
| `prd/05-ux-flows.md` | S05 satu langkah; hapus S24; §3 responsif mode aplikasi |
| `prd/06-milestones.md` | M3 PIN + nav; M5; M7 |
| `prd/07-test-plan.md` | Uji PIN, navigasi mobile, redirect `/admin`; hapus uji MFA |
| `prd/08-deployment.md` | Env PIN/WA; runbook reset |
| `prd/09-superadmin-admin.md` → `prd/09-panel-superadmin.md` | Rename + tulis ulang peran |
| `prd/10-design-tokens.md` | Catatan chart |
| `prd/11-component-inventory.md` | Hapus MFA/PermissionEditor; tambah komponen baru |
| `prd/12-route-map.md` | Semua `/admin` → `/superadmin`; rute baru |
| `prd/README.md` | Daftar dokumen & status |
| `README.md` | Status, autentikasi, struktur |

**Gate:** `grep -ri "mfa\|/admin\|ADMIN" prd/ README.md` tidak menyisakan referensi yang salah (kecuali catatan historis yang disengaja).

### T0.2 Kunci keputusan

- [ ] Q6–Q11 dijawab dan `revisi.md` diperbarui.
- [ ] Q13–Q16 dijawab.
- [ ] I-01–I-08 dijawab.

### T0.3 Tambah test runner

| File | Aksi |
| --- | --- |
| `package.json` | Tambah `vitest` (dev), skrip `test`, `test:watch` |
| `vitest.config.ts` | Baru; environment node, alias `@/*` |
| `tests/unit/` | Baru; contoh `slug.test.ts`, `publish-gate.test.ts` |
| `tests/integration/` | Baru; dilewati bila `DATABASE_URL` kosong |
| `.github/workflows/ci.yml` | Tambah langkah `npm run test` setelah typecheck |

**Gate:** `npm run test` hijau dengan minimal 3 test.

### T0.4 Rehearsal migrasi

- [ ] `pg_dump` database lokal ke `backups/`.
- [ ] Siapkan DB salinan `reditech_rehearsal`.
- [ ] Catat waktu `migrate deploy` + seed.

---

## 4. Fase 1 — Rename panel + PIN

### PR-1.1 Skema & migrasi

| File | Aksi |
| --- | --- |
| `prisma/schema.prisma` | `enum Role { USER SUPERADMIN }`; hapus `ADMIN`; `User`: hapus `mfaEnabled/mfaSecretEnc/mfaRecoveryEnc/permissions`, tambah `pinHash String?`, `pinUpdatedAt DateTime?`, `failedPinCount Int @default(0)`, `pinLockedUntil DateTime?`; hapus `AdminInvite`; `AdminAuditLog` → `AuditLog` + `@@map("audit_logs")`; relasi `auditLogs` |
| `prisma/migrations/<ts>_panel_pin/` | Migrasi baru (SQL di bawah) |
| `prisma/checks/invariants.sql` | Tidak berubah, kecuali nama tabel audit pada komentar |
| `prisma.config.ts` | Tidak berubah |

SQL wajib (urutan):

```sql
-- 1. Enum
UPDATE users SET role = 'USER' WHERE role = 'ADMIN';
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
CREATE TYPE "Role_new" AS ENUM ('USER', 'SUPERADMIN');
ALTER TABLE users ALTER COLUMN role TYPE "Role_new" USING role::text::"Role_new";
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'USER';
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

-- 2. Audit
ALTER TABLE admin_audit_logs RENAME TO audit_logs;

-- 3. Hapus
ALTER TABLE users
  DROP COLUMN "mfaEnabled",
  DROP COLUMN "mfaSecretEnc",
  DROP COLUMN "mfaRecoveryEnc",
  DROP COLUMN permissions;
DROP TABLE admin_invites;

-- 4. Tambah
ALTER TABLE users
  ADD COLUMN "pinHash" TEXT,
  ADD COLUMN "pinUpdatedAt" TIMESTAMP(3),
  ADD COLUMN "failedPinCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "pinLockedUntil" TIMESTAMP(3);
```

- [ ] Migrasi jalan di DB kosong.
- [ ] Migrasi jalan di DB salinan berisi `ADMIN`.
- [ ] Rollback dicatat (rename balik + restore dump).

### PR-1.2 Seed

| File | Aksi |
| --- | --- |
| `prisma/seed.ts` | `admin@` → `superadmin@reditech.id`; hapus `editor@`; PIN `123456` (hash `scrypt`, `pinUpdatedAt = null`, `failedPinCount = 0`); `pengguna@` tetap |
| `prisma/seed-storage.ts` | Tidak berubah |
| `.env.example` | `SEED_ADMIN_PASSWORD` → `SEED_SUPERADMIN_PIN`; hapus `MFA_ENCRYPTION_KEY` |
| `.github/workflows/ci.yml` | Samakan env |

- [ ] Seed dua kali tidak menduplikasi.
- [ ] Login `superadmin@reditech.id` + `123456` berhasil setelah PR-1.3.

### PR-1.3 Rename panel

| Dari | Ke |
| --- | --- |
| `src/app/(admin)/` | `src/app/(panel)/` |
| `src/app/(panel)/admin/` | `src/app/(panel)/superadmin/` |
| `src/lib/admin/` | `src/lib/panel/` |
| `src/components/layout/admin-nav.tsx` | `superadmin-nav.tsx` |
| `src/components/admin/` | `src/components/panel/` |
| `AdminPageHeader` | `PanelPageHeader` |
| `adminNav()` | `superadminNav()` |
| `adminPathCapability()` | `panelPathCapability()` |
| `AdminAuditLog` | `AuditLog` |

File yang disentuh:

- `src/app/(panel)/layout.tsx`
- `src/app/(panel)/superadmin/**` (semua `page.tsx`, `actions.ts`)
- `src/components/layout/superadmin-nav.tsx`
- `src/components/panel/**`
- `src/lib/panel/{nav,audit,revisions,taxonomy}.ts`
- `src/lib/auth/actor.ts`, `src/lib/auth/permissions.ts`, `src/lib/auth/proxy-session.ts`
- `src/proxy.ts`
- `src/app/robots.ts`
- `src/app/(auth)/login/page.tsx` (redirect tujuan)
- `README.md`

Aturan:

- [ ] `git mv` agar riwayat terjaga.
- [ ] Semua import diperbarui; `grep -r "lib/admin\|(admin)\|AdminNav\|AdminPageHeader"`.
- [ ] `/admin/*` → `308 /superadmin/*` (proxy) selama satu rilis.
- [ ] `robots.txt`: `Disallow: /superadmin` dan tetap `/admin` untuk transisi.
- [ ] Status `403`/`410` tetap lewat replay.

### PR-1.4 PIN auth

| File | Aksi |
| --- | --- |
| `src/lib/auth/pin.ts` | **Baru**: `hashPin`, `verifyPin`, `normalizePin` (6 digit), `recordFailedAttempt`, `assertNotLocked` |
| `src/lib/auth/totp.ts` | **Hapus** |
| `src/lib/auth/mfa.ts` | **Hapus** |
| `src/lib/auth/crypto.ts` | Hapus fungsi enkripsi MFA; pertahankan yang dipakai sesi/PIN |
| `src/lib/auth/actor.ts` | `requireSuperadmin()`, `requireSuperadminRole()`, `actionActor()` tanpa kapabilitas |
| `src/lib/auth/permissions.ts` | `can()` hanya `role === "SUPERADMIN"`; hapus bundel |
| `src/lib/auth/sessions.ts` | Tambah `revokeSession(id)`, `revokeAll(userId)` |
| `src/app/(auth)/actions.ts` | `loginAction` (email + PIN), lockout, audit; `logoutAction`; hapus aksi MFA |
| `src/components/auth/login-form.tsx` | Satu form email + PIN; tanpa tautan MFA |
| `src/components/auth/mfa-form.tsx`, `enroll-confirm-form.tsx`, `disable-mfa-form.tsx` | **Hapus** |
| `src/app/(auth)/login/mfa/page.tsx` | **Hapus** + redirect |
| `src/app/(panel)/superadmin/mfa/**` | **Hapus** |
| `src/app/(panel)/superadmin/keamanan/page.tsx` | **Baru**: ganti PIN + daftar sesi |
| `src/app/(panel)/superadmin/keamanan/actions.ts` | **Baru**: `changePin`, `revokeSession`, `revokeAll` |
| `src/components/panel/security/pin-form.tsx` | **Baru** |
| `src/components/panel/security/session-list.tsx` | **Baru** |
| `src/proxy.ts` | Hapus `rd_mfa`, `MFA_CHALLENGE_COOKIE`, cabang MFA; `PANEL_PATH` |
| `src/app/(panel)/layout.tsx` | Hapus redirect ke `/superadmin/mfa` |
| `scripts/reset-pin.ts` | **Baru** + skrip `npm run superadmin:reset-pin` |
| `package.json` | Hapus `qrcode`, `@types/qrcode` |
| `.env.example` | Hapus `MFA_ENCRYPTION_KEY` |

Aturan PIN:

- [ ] 6 digit angka; input salah format → pesan validasi, bukan 500.
- [ ] Gagal → `failedPinCount += 1`; 5 gagal → `pinLockedUntil = now + 15 menit`.
- [ ] Login sukses → reset `failedPinCount`, `pinLockedUntil = null`.
- [ ] Pesan gagal generik.
- [ ] `pinUpdatedAt = null` + `requirePinChange` → redirect ke `/superadmin/keamanan`.
- [ ] OAuth callback menolak `SUPERADMIN` (siapkan hook untuk M4).
- [ ] Audit: `auth.login`, `auth.login.failed`, `auth.logout`, `auth.pin.changed`, `auth.session.revoked`, `system.pin_reset`.

### PR-1.5 Guard dashboard

| File | Aksi |
| --- | --- |
| `src/proxy.ts` | `/dashboard*` tanpa sesi → `307 /login?redirect=…` |
| `src/app/(app)/layout.tsx` | `requireUser()` (baru di `src/lib/auth/actor.ts`) |
| `src/lib/auth/actor.ts` | Tambah `requireUser()` |

- [ ] USER suspended → sesi dicabut, login ditolak.
- [ ] Guest `/dashboard` → 307.

**Gate Fase 1:** login PIN berhasil; `/admin/*` 308; tidak ada rujukan MFA; lint/typecheck/build/test hijau.

---

## 5. Fase 2 — Shell navigasi

| File | Aksi |
| --- | --- |
| `src/components/layout/panel-header.tsx` | **Baru**: trigger, breadcrumb, search, quick create, notifikasi, user menu |
| `src/components/layout/panel-breadcrumb.tsx` | **Baru** |
| `src/components/layout/panel-search.tsx` | **Baru**: `command` + `dialog`, hanya SUPERADMIN |
| `src/components/layout/quick-create-menu.tsx` | **Baru** |
| `src/components/layout/notification-bell.tsx` | **Baru** (data placeholder 0) |
| `src/components/layout/user-menu.tsx` | **Baru** |
| `src/components/layout/app-sidebar.tsx` | **Baru**: shadcn `sidebar`, ≥768px |
| `src/components/layout/mobile-tab-bar.tsx` | **Baru**: 56px + safe-area |
| `src/components/layout/mobile-menu-screen.tsx` | **Baru** |
| `src/components/layout/app-shell.tsx` | **Hapus** setelah migrasi |
| `src/app/(panel)/layout.tsx` | Pakai `PanelHeader` + `AppSidebar`; tanpa footer |
| `src/app/(app)/layout.tsx` | Idem; nav USER final |
| `src/app/(panel)/superadmin/menu/page.tsx` | **Baru** |
| `src/app/(app)/dashboard/akun/page.tsx` | **Baru** (atau redirect ke profil) |
| `src/lib/panel/nav.ts` | Hapus `Antrean ulasan`; `Keamanan akun` → `/superadmin/keamanan` |
| `src/lib/nav/user-nav.ts` | **Baru** (dipisah dari layout) |

Aturan:

- [ ] Sidebar hanya `≥768px`; tab bawah hanya `<768px`.
- [ ] Tab SUPERADMIN: Ringkasan, Item, Pesanan, Lainnya.
- [ ] Tab USER: Ringkasan, Source code, Pembelian, Unduhan, Akun.
- [ ] `aria-current`, label teks, target 44px, `padding-bottom` konten.
- [ ] Tanpa footer.

**Gate:** 375px, 768px, 1280px tanpa sidebar di mobile; back dari `/superadmin/menu` bekerja.

---

## 6. Fase 3 — Media library

| File | Aksi |
| --- | --- |
| `src/app/api/panel/media/route.ts` | **Baru** (sebelumnya direncanakan `/api/admin/media`) |
| `src/lib/media/upload.ts` | **Baru**: validasi mime/ukuran, sha256, simpan, metadata |
| `src/lib/media/queries.ts` | **Baru**: daftar, cari, pemakaian |
| `src/lib/media.ts` | Tambah `mediaUrl()` untuk key lokal/R2 |
| `src/app/(panel)/superadmin/media/page.tsx` | Ganti `RouteStub` + actions |
| `src/app/(panel)/superadmin/media/actions.ts` | **Baru**: upload, updateAlt, delete |
| `src/components/panel/media/media-grid.tsx` | **Baru** |
| `src/components/panel/media/media-picker.tsx` | **Baru** (dipakai item/tutorial/settings) |
| `src/lib/storage/local.ts` | Pastikan path traversal ditolak |
| `src/lib/storage/types.ts` | Tambah `put()` bila belum ada |

Aturan:

- [ ] 5 MB, `image/jpeg|png|webp`.
- [ ] `alt` wajib; dedup sha256.
- [ ] `MediaUsage` ditulis saat media dipakai.
- [ ] Hapus media terpakai ditolak + daftar pemakaian.
- [ ] Bila I-04 = tambah paket: ajukan dulu, jangan pasang diam-diam.

**Gate:** unggah 3 gambar, pakai di form item, hapus ditolak saat terpakai.

---

## 7. Fase 4 — CRUD Item (form produk)

| File | Aksi |
| --- | --- |
| `src/app/(panel)/superadmin/item/page.tsx` | Daftar + filter + paginasi; ganti stub |
| `src/app/(panel)/superadmin/item/new/page.tsx` | Form baru |
| `src/app/(panel)/superadmin/item/[id]/page.tsx` | Form edit + riwayat |
| `src/app/(panel)/superadmin/item/schema.ts` | **Baru**: Zod per tab |
| `src/app/(panel)/superadmin/item/actions.ts` | **Baru**: create, update, submitReview, publish, archive, restore, delete, setPrice, verifyFile |
| `src/components/panel/item/item-form.tsx` | **Baru** |
| `src/components/panel/item/tabs/dasar-tab.tsx` | **Baru** |
| `src/components/panel/item/tabs/konten-tab.tsx` | **Baru** |
| `src/components/panel/item/tabs/harga-tab.tsx` | **Baru** |
| `src/components/panel/item/tabs/berkas-tab.tsx` | **Baru** (radio PROXY/EXTERNAL_LINK) |
| `src/components/panel/item/tabs/galeri-tab.tsx` | **Baru** |
| `src/components/panel/item/tabs/seo-tab.tsx` | **Baru** |
| `src/components/panel/item/publish-gate.tsx` | **Baru** |
| `src/components/panel/item/drive-file-tester.tsx` | **Baru** |
| `src/lib/panel/items.ts` | **Baru**: query daftar/detail, slug unik, redirect |
| `src/lib/panel/publish-gate.ts` | **Baru**: hitung 6 syarat |
| `src/lib/panel/revisions.ts` | Dipakai untuk simpan |
| `src/lib/panel/audit.ts` | Dipakai untuk setiap aksi |
| `prisma/schema.prisma` | Tambah `downloadMode`, `externalUrl`, `externalHost`, `linkCheckedAt` (bila Fase 7 dikerjakan bersamaan) |

Aturan:

- [ ] Harga hanya SUPERADMIN.
- [ ] Slug beku setelah terbit; perubahan membuat `Redirect`.
- [ ] Gate: berkas terverifikasi < 24 jam, thumbnail, ≥1 screenshot, harga valid, deskripsi ≥200, slug unik.
- [ ] Setiap simpan menulis `Revision` + `AuditLog`.
- [ ] Konflik `updatedAt` → dialog diff.
- [ ] Media dipilih lewat `MediaPicker`.

**Gate:** item POS dibuat → terbit → tampil publik → arsip `410`.

---

## 8. Fase 5 — Wadah Pengaturan

| File | Aksi |
| --- | --- |
| `src/lib/settings.ts` | Tambah tipe kunci, default, parser aman, `getSettingsGroup()` |
| `src/lib/panel/settings.ts` | **Baru**: simpan per field + revision + audit + `updateTag("settings")` |
| `src/app/(panel)/superadmin/pengaturan/page.tsx` | Ganti stub; tab dari `?tab=` |
| `src/app/(panel)/superadmin/pengaturan/actions.ts` | **Baru** |
| `src/components/panel/settings/setting-field.tsx` | **Baru** |
| `src/components/panel/settings/asset-field.tsx` | **Baru**: `MediaPicker` + badge "default" |
| `src/components/panel/settings/connection-status.tsx` | **Baru**: `BELUM DIKONFIGURASI` / `TERHUBUNG` |
| `src/components/panel/settings/whatsapp-connect-card.tsx` | **Baru**: nomor + `Konekkan` (disabled bila `WHATSAPP_GATEWAY_API_KEY` kosong) |
| `src/components/panel/settings/payment-card.tsx` | **Baru**: provider `DOKU` read-only + expiry |
| `src/lib/whatsapp/` | **Baru**: tipe + klien stub; tidak memanggil jaringan tanpa kontrak |

Tab & kunci:

- [ ] Identitas: 8 key `brand.*`
- [ ] Landing: `landing.heroMediaId`, `landing.assets`
- [ ] Umum: `site.*`
- [ ] Harga: `pricing.*`
- [ ] Pembayaran: `payment.provider`, `payment.expiryMinutes` (tanpa integrasi)
- [ ] Iklan: `ads.*`
- [ ] WhatsApp: `whatsapp.*` + tombol disabled sampai API key + kontrak
- [ ] Email: `email.*`
- [ ] SEO: `seo.*`
- [ ] Keamanan: `security.*` + ganti PIN

Aturan:

- [ ] Simpan per field; nilai lama saat konflik.
- [ ] `revalidateTag("settings")` + `("brand")` untuk aset.
- [ ] Jangan menampilkan “berhasil terhubung” tanpa panggilan nyata.

**Gate:** semua tab menyimpan ke `settings`; WhatsApp/payment menampilkan status jujur.

---

## 9. Fase 6 — Wadah konten lain

| Modul | File utama | Status |
| --- | --- | --- |
| Tutorial | `src/app/(panel)/superadmin/tutorial/{page,new,[id]}`, `schema.ts`, `actions.ts`, `components/panel/tutorial/*` | stub → form |
| Sponsor | `src/app/(panel)/superadmin/sponsor/{page,[id]}`, actions | stub → list + moderasi |
| Request | `src/app/(panel)/superadmin/request/{page,[id]}`, actions | stub → pipeline |
| Pengguna | `src/app/(panel)/superadmin/pengguna/{page,[id]}`, actions | stub → list + suspend |
| Pesanan | `src/app/(panel)/superadmin/pesanan/{page,[orderNo]}`, actions | stub → read-only + timeline |
| Entitlement | `src/app/(panel)/superadmin/entitlement/page.tsx` | stub → cari + grant/revoke (butuh keputusan) |
| Audit | `src/app/(panel)/superadmin/audit/page.tsx`, export route | stub → list + CSV |
| Dashboard USER | `src/app/(app)/dashboard/**` | stub → M4 |

Catatan: aksi refund/entitlement/order **menunggu DOKU**; bangun tampilan read-only dulu.

---

## 10. Fase 7 — Tautan eksternal

| File | Aksi |
| --- | --- |
| `prisma/schema.prisma` | `DownloadMode`, `DownloadDelivery`, kolom item, `Download.delivery` |
| `src/app/(panel)/superadmin/item/tabs/berkas-tab.tsx` | Radio mode + `externalUrl` + `Validasi tautan` |
| `src/lib/panel/external-link.ts` | **Baru**: validasi host, https, allowlist, SSRF guard |
| `src/lib/downloads/redirect.ts` | **Baru**: terbitkan token → `302` |
| `src/app/api/download/file/[token]/route.ts` | Tambah cabang `EXTERNAL_LINK` |
| `src/lib/downloads/quota.ts` | Tetap berlaku untuk gratis |
| `src/lib/http/api.ts` | Tambah kode `EXTERNAL_LINK_DEAD` |

---

## 11. Fase 8 — Integrasi (jangan dikerjakan sebelum kontrak jelas)

| Integrasi | Yang harus tersedia dulu |
| --- | --- |
| DOKU | Dokumen API, sandbox, secret, metode, fee |
| WhatsApp | Kontrak `wassap.reditech.id`, API key, format QR/status |
| Email | Provider, kredensial, domain terverifikasi |
| Drive | Service account, folder, izin |
| R2 | Akun, bucket, public URL |

---

## 12. Lintas fase

### 12.1 Test minimum

| Area | Test |
| --- | --- |
| PIN | hash/verify, format, lockout 5×, reset |
| Auth | login sukses/gagal, OAuth SUPERADMIN ditolak |
| Guard | `/superadmin` anonim/USER/SUPERADMIN, `/dashboard` anonim |
| Rename | `/admin/x` → 308 `/superadmin/x` |
| Item | gate publikasi, harga per tipe, slug beku |
| Media | mime/ukuran, dedup, hapus terpakai |
| Settings | parse nilai rusak, fallback |
| Unduhan | token sekali pakai, kuota, tautan eksternal |

### 12.2 Aksesibilitas

- Satu `h1`, heading hierarkis.
- Nama aksesibilitas unik (dua searchbox, navigasi panel vs dashboard).
- Fokus terlihat (`focus-ring`), Escape menutup overlay.
- Tab bawah: label teks + `aria-current`.
- Kontras mengikuti `prd/10-design-tokens.md` §8.

### 12.3 Keamanan

- Tidak ada rahasia di log/HTML.
- Rate limit login 10/menit/IP.
- SSRF: hanya https + host allowlist; tolak IP privat.
- Upload: validasi mime nyata (magic bytes), bukan hanya `Content-Type`.
- Audit setiap aksi tulis.

### 12.4 Dokumentasi

Setiap PR memperbarui:
- `README.md` (bila perilaku/struktur berubah),
- `revisi.md` (bila keputusan berubah),
- `tasks.md` (status).

---

## 13. Inventaris file: aksi

| File saat ini | Aksi |
| --- | --- |
| `src/app/(admin)/**` | Rename ke `(panel)/superadmin/**` |
| `src/app/(admin)/admin/mfa/**` | Hapus |
| `src/app/(admin)/admin/ulasan/page.tsx` | Hapus |
| `src/app/(auth)/login/mfa/page.tsx` | Hapus |
| `src/components/auth/mfa-form.tsx` | Hapus |
| `src/components/auth/enroll-confirm-form.tsx` | Hapus |
| `src/components/auth/disable-mfa-form.tsx` | Hapus |
| `src/lib/auth/totp.ts` | Hapus |
| `src/lib/auth/mfa.ts` | Hapus |
| `src/lib/admin/*` | Rename ke `src/lib/panel/*`; hapus `route-capability.ts` |
| `src/components/layout/admin-nav.tsx` | Rename `superadmin-nav.tsx` |
| `src/components/layout/app-shell.tsx` | Hapus setelah Fase 2 |
| `src/components/admin/*` | Rename ke `components/panel/*` |
| `src/app/(app)/layout.tsx` | Tulis ulang pakai shell baru |
| `src/app/(app)/dashboard/page.tsx` | Isi Ringkasan (M4) |
| `src/app/(panel)/superadmin/page.tsx` | Isi Ringkasan (Fase 5/6) |
| `src/proxy.ts` | Guard baru + redirect |
| `prisma/seed.ts` | SUPERADMIN + PIN |
| `.env.example` | Env baru |
| `package.json` | Hapus `qrcode`; tambah `vitest` |

---

## 14. Strategi PR

| PR | Isi | Tidak boleh dicampur dengan |
| --- | --- | --- |
| PR-1 | Docs sync | Kode |
| PR-2 | Skema + seed + migrasi | Rename rute |
| PR-3 | Rename rute + proxy | Fitur baru |
| PR-4 | PIN auth + keamanan | Skema lagi |
| PR-5 | Shell navigasi | CRUD |
| PR-6 | Media | Item |
| PR-7 | Item CRUD | Settings |
| PR-8 | Settings | WhatsApp aktif |
| PR-9 | Konten lain | Integrasi |

Setiap PR: `lint`, `typecheck`, `build`, `test`, dan satu catatan verifikasi manual di deskripsi.

---

## 15. Rollback

| Perubahan | Rollback |
| --- | --- |
| Enum `Role` | Rename tipe + restore dump; jangan `DROP` setelah data berubah tanpa backup |
| Rename `audit_logs` | `ALTER TABLE audit_logs RENAME TO admin_audit_logs` |
| Rename rute | Kembalikan folder + hapus redirect |
| PIN | Restore kolom MFA dari dump bila perlu (tidak ada data berharga) |
| Migrasi lain | Expand → deploy → contract; jangan drop kolom di rilis yang sama |

---

## 16. Checklist serah terima ke developer

- [ ] Semua pertanyaan blocking di §2 dijawab.
- [ ] `revisi.md` dan `prd/` konsisten.
- [ ] Database salinan tersedia untuk rehearsal.
- [ ] Akses repo + CI diberikan.
- [ ] Kredensial yang belum ada dicatat sebagai `BLOCKED`, bukan ditebak.
- [ ] Developer membaca §0 sebelum menulis kode.

---

## 17. Riwayat status

| Tanggal | Perubahan |
| --- | --- |
| 28 Okt 2026 | Dokumen dibuat; Fase 0–8 dipetakan |
