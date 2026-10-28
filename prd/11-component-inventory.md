# Component Inventory

| Field | Isi |
| --- | --- |
| Landasan | **shadcn/ui komplit** ([`10-design-tokens.md`](10-design-tokens.md)) |
| Komponen domain | **55** (di atas primitif shadcn, tidak menggantikannya) |
| Rujukan layar | [`05-ux-flows.md`](05-ux-flows.md) S01–S29 |
| Prinsip | Tidak ada primitif buatan sendiri; semua interaksi memakai komponen shadcn/Radix di baliknya |

---

## 1. Tiga lapisan

| Lapisan | Isi | Boleh diubah? |
| --- | --- | --- |
| **L1 — shadcn** (`components/ui/*`) | 45 komponen hasil CLI, apa adanya | Hanya token; jangan ubah struktur |
| **L2 — wrapper** (`components/ui-ext/*`) | 6 komponen: default merek, varian, dan kontrak aksesibilitas | Ya, dengan alasan tertulis |
| **L3 — domain** (`components/<domain>/*`) | 55 komponen yang menyusun layar | Ya, ini bagian produk |

**Larangan:** membuat `Select.tsx`, `Dialog.tsx`, atau `Tooltip.tsx` sendiri. Semua sudah ada di L1.

---

## 2. Struktur folder

```
src/components/
├── ui/                    # L1 shadcn (dihasilkan CLI, jangan diedit manual)
├── ui-ext/                # L2 wrapper
│   ├── button.tsx
│   ├── icon-button.tsx
│   ├── badge.tsx
│   ├── field-group.tsx
│   ├── empty-state.tsx
│   └── toast.tsx
├── layout/                # header, nav, drawer, footer, sidebar, container
├── catalog/               # filter, kartu, galeri, sidebar unduhan
├── content/               # prose, code-block, TOC, sponsor inline
├── download/              # ad gate, price breakdown, status, invoice
├── dashboard/             # stat card, riwayat, form profil, MFA
└── admin/                 # data table, gate publikasi, diff, audit
```

Aturan penamaan: PascalCase untuk komponen, kebab-case untuk berkas, satu komponen utama per berkas.

---

## 3. Pemetaan L1 → pemakaian

| shadcn | Dipakai oleh |
| --- | --- |
| `button` | Button, IconButton, semua CTA |
| `badge` | Badge status & harga |
| `card` | ItemCard, SponsorCard, StatCard, PaymentStatusCard, EmptyState |
| `input`, `textarea`, `label`, `form` | FieldGroup, ProfileForm, SponsorForm, AdminSetting |
| `select` | Filter status di admin, `SettingField` bertipe enum, pemilih kategori pada form item |
| `command` + `popover` | SortCombobox (opsi berdeskripsi), MediaPicker, PermissionEditor |
| `radio-group` | TypeRadioGroup |
| `toggle-group` | CategoryChips |
| `checkbox` | DataTable selection, PermissionEditor |
| `dialog` | Lightbox, MfaSetup, MediaPicker |
| `alert-dialog` | ConfirmDestructive |
| `sheet`, `drawer` | MobileDrawer, form admin di layar sempit |
| `dropdown-menu` | ServicesMenu, aksi baris tabel |
| `table` | HistoryTable, DataTable |
| `tabs` | Tab item admin, tab pengaturan |
| `accordion` | Layanan di drawer, FAQ kebijakan (bila ada) |
| `breadcrumb` | Katalog, detail item, admin |
| `pagination` | Katalog (dengan `aria-current` ditambahkan) |
| `skeleton` | Semua keadaan memuat |
| `sonner` | Toast global |
| `tooltip` | IconButton, metadata padat |
| `alert` | FileSizeNotice, banner offline |
| `avatar` | Sidebar akun |
| `scroll-area` | Galeri thumbnail, sidebar panjang |
| `separator` | Sidebar, form section |
| `aspect-ratio` | Thumbnail 16:9 |
| `progress` | AdGateCountdown, unggah media |
| `sidebar` | AppSidebar |

---

## 4. Wrapper primitif (6)

| Komponen | Basis | Props / varian | State wajib | ARIA & perilaku |
| --- | --- | --- | --- | --- |
| `Button` | `button` + `cva` | `variant: primary/secondary/outline/ghost/destructive/destructiveOutline`; `size: sm/md/lg`; `loading`; `fullWidth`; `asChild` | default, hover, focus-visible, active, disabled, loading | `aria-busy` saat `loading`; teks tetap terlihat (spinner di kiri) |
| `IconButton` | `Button` size icon | `icon`, `label` (wajib), `size: sm/md` | idem | `aria-label` wajib; tanpa label → type error (props bertipe union) |
| `Badge` | `badge` + `cva` | `tone: premium/free/neutral/success/warning/danger`; `size: sm/md` | statis | Tone = latar + ikon; teks selalu terbaca (lihat `10-design-tokens.md` §9.2); warna bukan satu-satunya pembeda |
| `FieldGroup` | `form` + `label` | `label`, `hint`, `error`, `required` | default, error, disabled, readOnly | `htmlFor` + `aria-describedby` (hint & error) + `aria-invalid` |
| `EmptyState` | `card` + ikon | `icon`, `title`, `description`, `action` | default | Judul level 3; `role="status"` hanya bila hasil filter berubah |
| `Toast` | `sonner` | `type: success/error/info`; `duration` 4s/6s; `action` | enter, exit, action clicked | `aria-live` polite (sukses) / assertive (error); maksimum 3 sekaligus |

---

## 5. Tata letak (7)

| Komponen | Basis | Props / varian | State | ARIA & perilaku |
| --- | --- | --- | --- | --- |
| `Container` | `div` | `size: shell/prose/wide` | — | Tanpa landmark |
| `Header` | `header` | `authed: boolean` | default, scrolled, menu-open | `banner`; skip-link dirender sebelum header |
| `NavDesktop` | `nav` | `items`, `activePath` | default, hover | `aria-label="Navigasi utama"`, `aria-current="page"` |
| `ServicesMenu` | `dropdown-menu` | 2 item + subjudul | closed, open (klik **dan** hover) | `aria-haspopup`, `aria-expanded`, `Escape` menutup, fokus kembali ke trigger |
| `MobileDrawer` | `sheet` | `triggerLabel="Buka menu"` | closed, open | Focus trap, `Escape`, tombol ≥44px, `Layanan` jadi `accordion` |
| `Footer` | `footer` | 3 kolom + sosial + CTA WA | — | `contentinfo` |
| `AppSidebar` | `sidebar` | `items`, `user`, `onLogout`; `collapsible` | expanded, collapsed, active | `nav` berlabel; tombol `Keluar` bukan ikon saja |

---

## 6. Katalog (10)

| Komponen | Basis | Props / varian | State | ARIA & perilaku |
| --- | --- | --- | --- | --- |
| `FilterBar` | `div` | slot untuk tipe, kategori, sort, hasil | default, pending | `aria-busy` selama navigasi; kontrol **tidak** dinonaktifkan |
| `TypeRadioGroup` | `radio-group` | `value: all/free/premium` | checked | `fieldset` + `legend` "Tipe"; 3 radio |
| `CategoryChips` | `toggle-group` single | `categories[]`, `value` | active, idle | `aria-pressed`; scroll horizontal dengan snap di mobile |
| `SortCombobox` | `popover` + `command` | `value: newest/popular/oldest` | closed, open | `combobox`; label "Urutkan"; deskripsi opsi per item |
| `ResultCount` | `p` | `from`, `to`, `total`, `query?` | default, empty | `aria-live="polite"`; angka di `<strong>`; teks "untuk “x”" bila ada query |
| `ItemCard` | `card` + `Link` | `item` | default, hover (scale 1,03), focus | Satu tautan pembungkus; `alt` = judul; jumlah unduhan dibaca utuh ("1.175 unduhan") |
| `SponsorCard` | `card` | `sponsor` | default | Label "Dukung Reditech"; `rel="sponsored nofollow"`; tidak menyamar sebagai item |
| `ScreenshotGallery` | `div` + `dialog` | `images[]`, `index` | default, zoom | `role="group"` berlabel; tombol "Screenshot sebelumnya/berikutnya"; indikator "Lihat screenshot n" |
| `Lightbox` | `dialog` | `src`, `alt`, `index` | open | Focus trap, `Escape`, tombol tutup 44px, panah kiri/kanan |
| `DownloadSidebar` | `aside` | `item`, `entitlement?` | free, premium, owned, loading | `complementary`; heading "Download"; `<dl>` metadata |

---

## 7. Konten (5)

| Komponen | Basis | Props / varian | State | ARIA & perilaku |
| --- | --- | --- | --- | --- |
| `OnThisPage` | `nav` | `headings[]` | active section | `aria-label="Isi halaman"`; `aria-current="true"` pada bagian aktif |
| `Prose` | `div` | children (MDX) | — | Heading hierarkis tanpa lompatan; tabel bisa di-scroll |
| `CodeBlock` | `pre` + `Button` | `code`, `lang`, `filename?` | copied | Tombol `Salin` berlabel; `font-mono text-[13px]`; `overflow-x-auto` |
| `TOC` | `nav` | `items[]` | active | Sama dengan OnThisPage, versi ringkas untuk mobile |
| `SponsorInline` | `card` | `sponsor` | default | Label iklan; `rel="sponsored nofollow"` |

---

## 8. Unduhan & pembayaran (6)

| Komponen | Basis | Props / varian | State | ARIA & perilaku |
| --- | --- | --- | --- | --- |
| `AdGateCountdown` | `progress` + `Button` | `seconds`, `onReady` | counting, ready, bypassed (tanpa JS) | Diumumkan **sekali**; tombol `disabled` sampai selesai; tetap berfungsi tanpa JS |
| `ShareButtons` | `button` | `url`, `title` | copied | WhatsApp `target="_blank" rel="noopener"`; salin memberi toast |
| `PriceBreakdown` | `dl` | `subtotal`, `fee`, `total` | — | `<dl>` semantik; total di `<strong>`; nominal dari server |
| `PaymentStatusCard` | `card` | `status`, `orderNo`, `expiresAt` | pending, paid, expired, failed | `role="status"`; CTA `Cek status` (maks 3×/jam) |
| `InvoiceSheet` | `section` | `order`, `items`, `buyer` | screen, print | Print CSS A4; nomor invoice terbaca; tombol `Cetak` |
| `FileSizeNotice` | `alert` | `sizeBytes`, `resumable` | default, warning (>50 MB) | `role="note"`; menyebut konsekuensi, bukan hanya ukuran |

---

## 9. Dashboard (7)

| Komponen | Basis | Props / varian | State | ARIA & perilaku |
| --- | --- | --- | --- | --- |
| `StatCard` | `card` | `label`, `value`, `hint?` | default, loading | Nilai sebagai teks; label lengkap untuk pembaca layar |
| `HistoryTable` | `table` | `columns`, `rows`, `empty` | default, empty, loading | `<caption>`; `th scope`; baris kosong memakai EmptyState |
| `PurchaseRow` | `table-row` | `order` | — | Status memakai teks + Badge, bukan warna saja |
| `DownloadRow` | `table-row` | `item`, `purpose`, `at` | — | Tombol `Unduh ulang` dengan `aria-label` menyebut judul item |
| `ProfileForm` | `form` + RHF | `defaultValues` | idle, saving, success, error | Error per field; email `disabled` + dijelaskan |
| `PasswordSection` | `form` **atau** `p` | `mode: local/oauth` | local, oauth | Untuk OAuth: paragraf, bukan form disabled |
| `MfaSetup` | `dialog` | `qr`, `secret`, `code` | idle, enrolling, verifying, enabled | Input 6 digit `inputMode="numeric"`; recovery code bisa diunduh |

---

## 10. Admin (14)

| Komponen | Basis | Props / varian | State | ARIA & perilaku |
| --- | --- | --- | --- | --- |
| `AdminFilterBar` | `div` | `search`, `selects`, `dateRange` | default, applied | Filter tercermin di URL; tombol `Reset` |
| `DataTable` | `table` | `columns`, `rows`, `selection`, `sort`, `page` | default, empty, loading, error | `th scope`, `aria-sort`, checkbox header berlabel |
| `FormSection` | `fieldset` | `title`, `description` | — | `legend` wajib; dipakai di semua tab item |
| `PublishGateChecklist` | `ul` | `checks[] {ok, label, href}` | pass, fail | Status berupa **teks** ("Belum: berkas belum diuji"), bukan warna saja |
| `DriveFileTester` | `button` + status | `fileId` | idle, testing, ok, fail | Hasil menyebut nama berkas + ukuran; gagal menyebut sebab |
| `MediaPicker` | `dialog` | `onSelect`, `multiple` | browse, upload, selected | `alt` wajib sebelum simpan; pratinjau rasio |
| `DiffView` | `table` | `before`, `after` | — | Hanya field berubah; penanda `+`/`−` berupa teks |
| `ApprovalQueueRow` | `row` | `revision` | pending, approved, rejected | `Tolak` meminta alasan; `Setujui` menampilkan diff dulu |
| `PermissionEditor` | `checkbox` group | `capabilities`, `bundles` | — | Grup per entitas; setiap kapabilitas punya penjelasan satu kalimat |
| `SettingField` | `FieldGroup` | `key`, `type`, `value` | idle, saving, saved, error | Simpan per field; nilai lama ditampilkan saat konflik |
| `AuditRow` | `row` | `actor`, `action`, `entity`, `diff` | collapsed, expanded | Waktu absolut + relatif; diff di `<details>` |
| `ConfirmDestructive` | `alert-dialog` | `phrase`, `onConfirm` | idle, typing, confirming | Input harus sama persis; tombol aktif setelah cocok; fokus ke input |
| `BulkActionBar` | `div` sticky | `selectedCount`, `actions` | idle, running, partial | Maksimum 100 baris; hasil per baris dilaporkan |
| `OrderTimeline` | `ol` | `events[]` | — | Urutan kronologis; setiap langkah menyebut sumber (webhook/manual) |

---

## 11. Deep dive

### 11.1 `Button`

```ts
type ButtonProps = {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "destructiveOutline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
} & React.ComponentProps<typeof ShadcnButton>;
```

| Varian | Latar | Teks | Kontras | Dipakai untuk |
| --- | --- | --- | --- | --- |
| `primary` | `--primary` (aqua) | `--primary-foreground` (hitam) | 11,8:1 | **Satu per layar**: `Beli Source Code`, `Download Tanpa Iklan`, `Masuk`, `Simpan` |
| `secondary` | `--secondary` (#202020) | putih | 16,3:1 | Aksi tegas non-utama (mis. `Kirim Request`) |
| `outline` | transparan + `--border-strong` | `--foreground` | 21:1 | Aksi sekunder: `Batal`, `Filter`, `Download Gratis` |
| `ghost` | transparan | `--foreground` | 21:1 | Aksi dalam tabel, tutup dialog |
| `destructive` | `--destructive` | hitam | 5,10:1 | Konfirmasi final di `ConfirmDestructive` |
| `destructiveOutline` | transparan + border `--destructive` | `--foreground` + ikon merah | 21:1 | Refund/Hapus inline, cabut akses |

Penegakan aturan: `primary` maksimum satu per layar — dicek lewat lint rule `one-primary-per-view`, bukan lewat tipe (jumlah render tidak bisa dinyatakan di sistem tipe). Varian `destructive` hanya boleh dipakai di dalam `ConfirmDestructive`.

Alasan: aqua adalah satu-satunya warna aksi (`design.md`: *"spend aqua on one primary action"*, *"don't flood backgrounds with aqua"*). Karena tidak ada warna kedua untuk CTA premium, hierarki dibangun dari **bentuk** — isi aqua untuk jalur berbayar, garis untuk jalur gratis — bukan dari dua warna bersaing.

Hover: `primary` → `bg-primary/90`; `secondary` → `bg-secondary/90`. Opasitas token dipakai, bukan `color-mix` atau token turunan baru, karena `10-design-tokens.md` §7 membatasi nilai turunan menjadi tiga dan melarang kelas arbitrer di luar `text-[13px]`/`shadow-pop`. Kontras label tidak turun: hitam di atas aqua muda tetap ≥ 11:1.

```
sm  ┌──────────────────────┐  h-8  px-3 text-sm
    │ [i]  Label      [i]  │
    └──────────────────────┘
md  h-10 px-4 text-sm
lg  h-12 px-5 text-base
```

Aturan: maksimum satu `primary` per area pandang (dua bila salah satunya di dialog yang menutupi layar). `loading` tidak boleh mengubah lebar tombol (spinner menempati ruang ikon kiri). `destructive` hanya di dalam `AlertDialog`; di baris tabel selalu `destructiveOutline`.

### 11.2 `SortCombobox`

```
┌──────────────────────────────┐
│ Urutkan                      │
│ ┌──────────────────────────┐ │
│ │ Terbaru                ▾ │ │  trigger h-10 w-36 sm:w-44
│ └──────────────────────────┘ │
│        ↓ (popover, align=end)
│ ┌──────────────────────────┐ │
│ │ ✓ Terbaru                │ │  text-sm
│ │   Rilis paling baru dulu │ │  text-xs text-muted-foreground
│ ├──────────────────────────┤ │
│ │   Terpopuler             │ │
│ │   Paling banyak diunduh   │ │
│ ├──────────────────────────┤ │
│ │   Terlama                │ │
│ │   Rilis paling awal dulu │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

Perilaku: memilih `Terbaru` menghapus parameter `sort` dari URL (paritas acuan). Panah atas/bawah memindah fokus; `Enter` memilih; `Escape` menutup tanpa memilih.

### 11.3 `ScreenshotGallery` + `Lightbox`

```
┌──────────────────────────────────┐
│  ┌────────────────────────────┐  │
│  │        screenshot 1        │  │  aspect-video, object-cover, object-top
│  │                            │  │
│  └────────────────────────────┘  │
│  ‹  ● ○ ○                     ⤢  │  prev/next, indikator, Perbesar
└──────────────────────────────────┘
```

- Tombol per gambar: `Lihat screenshot 1/2/3` (bukan angka saja).
- `Perbesar` membuka `Dialog` selebar viewport dengan panah kiri/kanan dan `Escape`.
- Gambar memakai `next/image` dengan `sizes` sesuai grid, `loading="lazy"` kecuali gambar pertama (`priority`).

### 11.4 `DownloadSidebar`

```
┌──────────────────────────────────┐
│ Gratis · Tanpa login             │  Badge tone=free
│ Termasuk database, data contoh,  │
│ dan panduan instalasi.           │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Download Tanpa Iklan · Rp3.000│ │ Button variant=primary size=lg, fullWidth
│ └──────────────────────────────┘ │ label hitam di atas aqua (11,8:1)
│ Bayar QRIS · total Rp 3.021      │  text-xs text-muted-foreground
│ Langsung terbuka di Drive.       │
│ 82 orang memilih tanpa iklan …   │
│                                  │
│ Download Gratis (lewat iklan) →  │  Link underline, bukan tombol
│ Melewati halaman iklan +        │
│ hitung mundur sebelum tautan.    │
│ ───────────────────────────────  │
│ Teknologi   PHP                  │  <dl>
│ Lisensi     Gratis               │
│ Download    1.175                │
│ Rilis       31 Agustus 2026      │
│ ───────────────────────────────  │
│ [Bagikan] [Salin link]           │
│ Gabung saluran WhatsApp →        │
└──────────────────────────────────┘
```

Empat keadaan: `free` (dua CTA), `premium` (satu CTA beli + `Lihat demo`), `owned` (tombol `Unduh` langsung, tanpa harga), `loading` (skeleton). Sidebar `sticky top-24` di ≥1024px.

Catatan warna: CTA beli adalah **satu-satunya aqua** di halaman detail; jalur gratis turun menjadi `outline` + tautan bergaris bawah, karena Celestial tidak punya warna kedua untuk CTA. Badge `Gratis` memakai tone `free` (garis + teks hitam), bukan isi berwarna — hierarki premium/gratis dibawa bentuk, ikon, dan kata (lihat `10-design-tokens.md` §9).

Karena `design.md` memakai radius 8px dan padding tombol 12px, tombol `lg` di sidebar memakai `h-12 rounded-md` (6px) sesuai skala kontrol, bukan `rounded-xl`.

### 11.5 `DataTable`

```
┌────────────────────────────────────────────────────┐
│ [cari…]  [status ▾] [kategori ▾] [tanggal ▾] Reset │  AdminFilterBar
├──┬──────────────────┬────────┬─────────┬───────────┤
│☐ │ Judul            │ Status │ Unduhan │ Diperbarui│  th scope=col, aria-sort
├──┼──────────────────┼────────┼─────────┼───────────┤
│☐ │ Aplikasi POS     │ ● Terbit│ 1.175  │ 2 hari    │
│☐ │ LMS Sekolah      │ ○ Draf  │ 0      │ 5 jam     │
├──┴──────────────────┴────────┴─────────┴───────────┤
│ 2 dipilih   [Terbitkan] [Arsipkan]                 │  BulkActionBar (sticky)
│                               ‹ 1 2 3 ›            │
└────────────────────────────────────────────────────┘
```

- Sortir server-side lewat `?sort=`; klik header mengubah URL, bukan state lokal.
- Baris kosong: `EmptyState` di dalam `<td colSpan>`.
- Aksi baris di `dropdown-menu` (⋮) — tidak pernah berupa ikon tanpa label aksesibel.

### 11.6 `ConfirmDestructive`

```
┌────────────────────────────────────────────┐
│ Hapus item permanen                        │
│                                            │
│ Item ini juga menghapus riwayat revisinya. │
│ Tindakan tidak dapat dibatalkan.           │
│                                            │
│ Ketik slug untuk melanjutkan:              │
│ ┌────────────────────────────────────────┐ │
│ │ aplikasi-point-of-sales-pos-mtgs89ab   │ │
│ └────────────────────────────────────────┘ │
│                                            │
│              [Batal]  [Hapus permanen]     │  tombol nonaktif sampai cocok
└────────────────────────────────────────────┘
```

Wajib untuk: hapus item/tutorial permanen, refund, cabut entitlement, ubah peran, hapus media. Frasa yang diketik: slug item, `REFUND`, email pengguna, atau `HAPUS`.

### 11.7 `PublishGateChecklist`

```
Terbitkan item — 2 dari 6 belum selesai
┌──────────────────────────────────────────────┐
│ ✓ Berkas Drive terverifikasi (12,4 MB)       │
│ ✓ Thumbnail tersedia                         │
│ ✗ Screenshot minimal 1  →  tab Galeri        │
│ ✓ Harga valid (Rp 3.000)                     │
│ ✗ Deskripsi minimal 200 karakter (142)       │
│ ✓ Slug unik                                  │
└──────────────────────────────────────────────┘
```

Tombol `Terbitkan` nonaktif dan setiap baris gagal punya tautan langsung ke tab yang memperbaikinya. Ini satu-satunya tempat di UI yang boleh menampilkan status gagal sebelum submit.

---

## 12. Matriks estado global

| Estado | Representasi | Catatan |
| --- | --- | --- |
| Memuat daftar | `Skeleton` baris (bukan spinner halaman) | Minimal 3 baris agar layout stabil |
| Memuat halaman | `loading.tsx` per segmen dengan skeleton struktur | Tidak boleh menggeser layout |
| Kosong | `EmptyState` (judul + satu kalimat + CTA) | Satu komponen untuk semua konteks |
| Error data | `Alert` + `requestId` + `Coba lagi` | Jangan menampilkan stack trace |
| Tanpa izin | Halaman 403 dengan kapabilitas yang kurang | Bukan 404, bukan redirect |
| Validasi gagal | `FieldGroup` error + fokus ke field pertama | `aria-invalid` |
| Aksi berhasil | `Toast` ringkas | Tidak ada dialog sukses untuk aksi rutin |
| Aksi berjalan | Tombol `loading` + nonaktif | Bukan overlay penuh |

Pratinjau semua komponen dan estado: rute `/dev/components`, hanya aktif bila `NODE_ENV !== "production"` atau pengguna `SUPERADMIN`. Tidak memakai Storybook.

---

## 13. Definition of done per komponen

1. Berkas di folder lapisan yang benar; tidak ada duplikasi dengan `components/ui`.
2. Props bertipe eksplisit, diekspor, tanpa `any`.
3. Semua state di tabel terimplementasi (bukan hanya `default`).
4. Keyboard: Tab masuk/keluar, `Enter`/`Space` mengaktifkan, `Escape` menutup overlay.
5. Nama aksesibilitas unik di seluruh halaman tempat ia dipakai.
6. Tidak ada warna hardcoded, tidak ada kelas arbitrer di luar pengecualian `10-design-tokens.md` §7, dan tidak ada aqua sebagai warna teks/indikator tunggal (lihat §8–§9 dokumen yang sama).
7. Punya test render + satu test interaksi (Playwright atau Vitest).
8. Terdaftar di `/dev/components` dengan contoh tiap varian.
9. Tidak menambah dependensi baru.

---

## 14. Pemetaan layar → komponen

| Layar | Komponen utama |
| --- | --- |
| S02 Katalog | Header, FilterBar, TypeRadioGroup, CategoryChips, SortCombobox, ResultCount, ItemCard, SponsorCard, Pagination, EmptyState |
| S03 Detail | Breadcrumb, ScreenshotGallery, Lightbox, OnThisPage, Prose, DownloadSidebar, ShareButtons, FileSizeNotice |
| S04 Interstisial | AdGateCountdown, SponsorInline, FileSizeNotice |
| S05 Login | FieldGroup, Button, Alert (error) |
| S15–S19 Dashboard | AppSidebar, StatCard, HistoryTable, PurchaseRow, DownloadRow, EmptyState |
| S20 Profil | ProfileForm, PasswordSection, MfaSetup, FieldGroup |
| S21 Checkout | PriceBreakdown, PaymentStatusCard, Button (primary) |
| S23 Editor item | FormSection, FieldGroup, MediaPicker, DriveFileTester, PublishGateChecklist, Tabs |
| S24 Antrean | DataTable, DiffView, ApprovalQueueRow |
| S25 Pesanan | DataTable, OrderTimeline, ConfirmDestructive, Badge |
| S26 Pengguna | DataTable, PermissionEditor, ConfirmDestructive |
| S27 Pengaturan | Tabs, SettingField, FormSection |
| S28 Audit | DataTable, AuditRow, DiffView |

---

## 15. Yang sengaja tidak dibuat sebagai komponen

| Hal | Alasan |
| --- | --- |
| Grafik/chart | Tidak ada kebutuhan di v1; kartu statistik memakai angka |
| Editor WYSIWYG | Markdown/MDX + pratinjau sisi server lebih aman dan lebih kecil |
| Carousel otomatis | Galeri butuh kontrol eksplisit, bukan autoplay |
| Komponen tema gelap | Token `.dark` sudah ada, tetapi toggle belum dikirim di v1 |
| Wrapper `Table` generik tambahan | `DataTable` sudah cukup; `Table` shadcn dipakai langsung di tempat sederhana |
| Komponen ikonografi kustom | `lucide` mencakup semua kebutuhan |
