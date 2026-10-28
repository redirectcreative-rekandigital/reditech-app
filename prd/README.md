# PRD Reditech Platform

Paket dokumen produk untuk **Reditech.id** — layanan end-to-end: katalog source code, dua jalur unduhan, checkout, dashboard pengguna, dan panel superadmin untuk seluruh konten.

| Identitas | Nilai |
| --- | --- |
| Nama produk | **Reditech** |
| Domain produksi | `https://www.reditech.id` (apex `reditech.id` → `308` ke `www`) |
| Prefiks nomor pesanan | `RT-` |
| Acuan investigasi | Papicode.id, snapshot read-only 28 Oktober 2026 (dokumen investigasi tidak disertakan dalam repo ini) |
| Identitas visual | Tema **Celestial** ([`design.md`](design.md)) — aqua `#58d3db`, hitam, putih; Open Sans / Georgia / Menlo; radius 8px |

Basis: investigasi read-only 28 Oktober 2026 terhadap papicode.id. Model, struktur URL, dan perilaku produk direkonstruksi dari acuan tersebut; setiap keputusan yang menyimpang dicatat eksplisit, bukan disembunyikan.

---

## Baca dalam urutan ini

| # | Dokumen | Isi | Untuk siapa |
| --- | --- | --- | --- |
| 1 | [`00-tech-stack.md`](00-tech-stack.md) | Stack final + 12 ADR (termasuk Google Drive, CSP, paginasi, shadcn, tema Celestial) | Teknis |
| 2 | [`01-prd.md`](01-prd.md) | Problem, tujuan, persona, ruang lingkup, **tabel paritas 20 baris** | Semua |
| 3 | [`02-requirements.md`](02-requirements.md) | 100+ requirement ber-ID dengan prioritas & acceptance criteria | PM, QA |
| 4 | [`03-data-model.md`](03-data-model.md) | ERD, skema Prisma, 13 invariant, retensi | Backend |
| 5 | [`04-api-spec.md`](04-api-spec.md) | Endpoint, kontrak error, state machine pembayaran, server action admin | Backend, FE |
| 6 | [`05-ux-flows.md`](05-ux-flows.md) | 29 layar, 12 alur, responsif, 10 aturan a11y, mikroSalin | Desain, FE |
| 7 | [`10-design-tokens.md`](10-design-tokens.md) | **Tema Celestial** (dari [`design.md`](design.md)): token shadcn, tipografi, radius, spasi, kontras | FE, Desain |
| 8 | [`11-component-inventory.md`](11-component-inventory.md) | 55 komponen domain di atas shadcn, props/state/ARIA, deep dive, DoD | FE |
| 9 | [`12-route-map.md`](12-route-map.md) | 71 rute, guard per rute, cache/revalidasi, canonical, redirect, error | FE, Backend |
| 10 | [`09-superadmin-admin.md`](09-superadmin-admin.md) | Model peran kapabilitas, CRUD semua konten, gate publikasi, audit, keamanan panel | Pemilik, Backend |
| 11 | [`06-milestones.md`](06-milestones.md) | M0–M7, 61 person-day, dependensi, DoD | PM |
| 12 | [`07-test-plan.md`](07-test-plan.md) | Piramida test, 15 regresi wajib, kasus tepi, checklist rilis | QA |
| 13 | [`08-deployment.md`](08-deployment.md) | Docker Compose, CI/CD blue-green, backup, alert, runbook | Ops |

---

## Empat keputusan yang mengunci seluruh paket

1. **Target** — rekonstruksi setara + perbaikan; bug lama diperbaiki dan dicatat di `01-prd.md` §11.
2. **Hosting** — VPS + Docker di belakang Cloudflare.
3. **Berkas** — Google Drive untuk kedua jalur, tetapi **selalu lewat proxy server**; tautan Drive tidak pernah sampai ke browser (ADR-001).
4. **Pembayaran** — DOKU saja, satu state machine, webhook idempoten.

---

## Yang berubah dari situs acuan

| Perubahan | Alasan |
| --- | --- |
| Paginasi di luar rentang → `308` (bukan 200 + "1177–69") | Bug yang membingungkan pengguna |
| CSP nonce ditambahkan | Situs acuan memuat skrip iklan tanpa CSP |
| Rantai shortlink iklan diganti interstisial sendiri | Keamanan & auditabilitas |
| Riwayat unduhan gratis ditampilkan | Keluhan pengguna yang terdokumentasi |
| Panel superadmin dirancang dari nol | Area lama tidak pernah teramati |
| Dua searchbox diberi label berbeda | Duplikasi nama aksesibilitas |
| Teks kebijakan diselaraskan dengan implementasi | Kebijakan acuan menyebut password padahal registrasi hanya Google |
| Identitas visual baru: tema **Celestial** (aqua `#58d3db`, hitam, putih) | Rebrand Reditech; palet lama milik Papicode (ADR-012) |
| Tipografi Open Sans / Georgia / Menlo, radius 8px | Mengikuti `design.md` |

Yang **tidak** berubah: struktur URL katalog, dua jalur unduhan, model harga, pembagian gratis/premium, dan seluruh alur fungsional. Warna & font berubah karena rebrand — deviasi visual disengaja, bukan regresi.

---

## Status

| Bagian | Status |
| --- | --- |
| Tech stack | **Frozen** (perubahan butuh ADR) |
| PRD inti | Draft untuk persetujuan |
| Requirement | Siap dieksekusi |
| Data model | Draft (perlu validasi `prisma validate`) |
| API spec | Draft |
| UX flows | Draft |
| Design tokens & komponen | **Siap** — tema Celestial (`design.md`) + shadcn/ui komplit + 55 komponen domain |
| Route map | **Siap** — 71 rute dengan guard & cache |
| Admin design | Draft, **dirancang bukan direkonstruksi** |
| Milestones | Estimasi awal |
| Test & deploy | Siap dipakai |

---

## Sebelum mulai coding

1. Jawab 11 open question di [`01-prd.md`](01-prd.md) §10 — minimal Q1, Q2, Q7, Q9.
2. Setujui tabel paritas §11 di dokumen yang sama.
3. Sediakan: service account Drive, akun DOKU sandbox, zona Cloudflare, domain `reditech.id`.
4. Ganti data identitas yang masih memakai placeholder: nomor WhatsApp, akun AdSense, alamat email, dan nama badan usaha.
5. Putuskan apakah ada akun `ADMIN` selain SUPERADMIN pada rilis pertama.
