# Design Tokens & UI Kit — Tema Celestial (shadcn/ui)

| Field | Isi |
| --- | --- |
| Sumber warna | **[`design.md`](design.md)** — tema Celestial (tweakcn): putih, tinta hitam, aqua `#58d3db` |
| UI kit | **shadcn/ui komplit** — semua primitif dari shadcn, bukan komponen buatan sendiri |
| Gaya | `new-york`, CSS variables, RSC aktif |
| Tailwind | v4 (CSS-first, `@theme inline`) |
| Ikon | `lucide-react` |
| Font | **Open Sans** (display & UI), **Georgia** (bacaan panjang), **Menlo** (kode) |
| Radius | `--radius: 0.5rem` (8px) — kontrol 6px, kartu 8px |
| Mode gelap | Token `.dark` **didefinisikan dari `design.md`**, tetapi toggle belum dikirim di v1 |

> `design-system.md` (dokumen investigasi di luar paket ini) tetap disimpan sebagai **bukti historis** papicode.id (palet hijau/terakota). Palet itu **tidak lagi dipakai** — Reditech memakai Celestial.

---

## 1. `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "utils": "@/lib/utils",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

Alternatif satu perintah (tema resmi tersedia): `npx shadcn@latest add @shadcnblocks/theme/celestial` — tetapi kita **menulis token manual** agar `design.md` tetap satu-satunya sumber dan tidak ada varian yang tidak tercatat.

---

## 1b. Tailwind v4 + shadcn: tidak ada lapisan ganda

shadcn **bukan** framework CSS dan bukan alternatif Tailwind. Ia adalah kumpulan berkas komponen (salin-tempel) yang **ditulis dengan Tailwind** dan perilakunya memakai Radix. Jadi yang terpasang hanya:

| Lapisan | Perannya | Jumlah |
| --- | --- | --- |
| Tailwind v4 | satu-satunya mesin styling (utility + token) | 1 |
| shadcn/ui | sumber komponen `components/ui/*` (kode milik kita) | 45 berkas |
| Radix UI | perilaku aksesibilitas di balik komponen shadcn | dependensi per komponen |
| `cva` + `cn` | varian & penggabungan kelas | 2 paket |

Yang **tidak** dipasang, karena akan menjadi duplikasi:

| Tidak dipasang | Alasan |
| --- | --- |
| `tailwind.config.js/ts` | Tailwind v4 memakai konfigurasi CSS-first; `components.json` → `"config": ""`. Satu sumber token: `globals.css` |
| `tailwindcss-animate` (plugin v3) | Diganti `tw-animate-css` (varian v4) |
| `@shadcn/ui` sebagai paket npm | shadcn bukan dependensi runtime; komponen disalin ke repo |
| Dua set token (`--brand-*` + `--primary`) | Kita memetakan 1:1; nama merek lama tidak dibuat ulang |
| `styled-components`/Emotion | Tidak ada CSS-in-JS; semua lewat Tailwind |

Dependensi awal:

```bash
# CLI shadcn 2026 memasang `cn` sendiri; jangan tambahkan clsx/tailwind-merge.
npx shadcn@latest init
npm install class-variance-authority lucide-react
npm install -D tailwindcss @tailwindcss/turbopack tw-animate-css
```

> **`cn` menggantikan `clsx` + `tailwind-merge`.** CLI shadcn (2026) menghasilkan
> `import { cn } from "cn"` dan memasang paket resmi
> [`cn`](https://github.com/shadcn-ui/cn) (`shadcn-ui/cn`, tanpa dependensi).
> Paket itu adalah drop-in untuk keduanya, jadi `src/lib/utils.ts` tidak dibuat
> dan `clsx`/`tailwind-merge` tidak boleh dipasang. `components.json` tetap
> menyimpan alias `utils` agar CLI tahu folder lib.

Dua baris wajib di `globals.css` (sering terlewat saat migrasi v4):

```css
@import "tailwindcss";
@import "tw-animate-css";

/* membuat utility `dark:` bereaksi pada kelas `.dark`, bukan prefers-color-scheme */
@custom-variant dark (&:is(.dark *));
```

Tanpa `@custom-variant dark`, blok `.dark` di §2 tidak akan pernah aktif — tokennya benar, tetapi tidak ada utility `dark:` yang membacanya.

---

## 2. Kontrak token

Seluruh nilai di bawah berasal dari `design.md`. Tiga hal yang ditambahkan, semuanya **turunan** dan bukan warna baru:

1. `--destructive-foreground` — `design.md` tidak menyebutkan. Dipilih **hitam** karena putih di atas `#f4212e` hanya **4,11:1** (gagal AA), sedangkan hitam **5,10:1** (lolos).
2. `--border-strong` — `color-mix()` dari `--border` dan `--foreground`, untuk batas kontrol yang harus lolos 3:1 (input `#e1eaef` di atas putih hanya 1,22:1).
3. `--ring-halo` — `color-mix()` dari `--ring` dan transparan, hanya hiasan di luar outline fokus yang berwarna `--foreground`.

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  /* ── Palet Celestial (design.md §colors) ──────── */
  --background: #ffffff;
  --foreground: #000000;

  --card: #f7f8f8;
  --card-foreground: #000000;

  --popover: #ffffff;
  --popover-foreground: #000000;

  --primary: #58d3db;
  --primary-foreground: #000000;      /* design.md: aqua terlalu terang untuk label putih */

  --secondary: #202020;
  --secondary-foreground: #ffffff;

  --muted: #f1f5f9;
  --muted-foreground: #323232;

  --accent: #e3ecf6;
  --accent-foreground: #323232;

  --destructive: #f4212e;
  --destructive-foreground: #000000;  /* turunan: putih gagal 4,11:1, hitam 5,10:1 */

  --border: #e1eaef;
  --input: #f7f9fa;
  --ring: #58d3db;

  --radius: 0.5rem;                   /* 8px → sm 4, md 6, lg 8, xl 12 */

  /* ── Sidebar ──────────────────────────────────── */
  --sidebar: #f7f8f8;
  --sidebar-foreground: #000000;
  --sidebar-primary: #58d3db;
  --sidebar-primary-foreground: #000000;
  --sidebar-accent: #e3ecf6;
  --sidebar-accent-foreground: #323232;
  --sidebar-border: #e1eaef;
  --sidebar-ring: #58d3db;

  /* ── Chart (disiapkan; komponen chart tidak dipasang di v1) */
  --chart-1: #58d3db;
  --chart-2: #00b87a;
  --chart-3: #f7b928;
  --chart-4: #17bf63;
  --chart-5: #e0245e;

  /* ── Turunan (color-mix 2 token, bukan warna baru) */
  --border-strong: color-mix(in oklab, var(--border) 60%, var(--foreground));
  --ring-halo: color-mix(in oklab, var(--ring) 30%, transparent);

  /* ── Elevasi & gerak ──────────────────────────── */
  --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.05);
  --shadow-pop: 0 12px 32px -12px rgba(0, 0, 0, 0.18);
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --duration-panel: 300ms;
  --duration-media: 500ms;
}

/* Mode gelap — nilai dari design.md §colors (dark-*).
   Didefinisikan, tetapi tidak ada toggle di v1. */
.dark {
  --background: #121212;
  --foreground: #e7e9ea;

  --card: #17181c;
  --card-foreground: #e7e9ea;

  --popover: #17181c;
  --popover-foreground: #e7e9ea;

  --primary: #58d3db;
  --primary-foreground: #000000;

  --secondary: #e7e9ea;
  --secondary-foreground: #121212;

  --muted: #1a1d1e;
  --muted-foreground: #8b98a5;

  --accent: #12383b;
  --accent-foreground: #e7e9ea;

  --destructive: #f4212e;
  --destructive-foreground: #000000;

  --border: #2f3336;
  --input: #1a1d1e;
  --ring: #58d3db;

  --sidebar: #17181c;
  --sidebar-foreground: #e7e9ea;
  --sidebar-primary: #58d3db;
  --sidebar-primary-foreground: #000000;
  --sidebar-accent: #12383b;
  --sidebar-accent-foreground: #e7e9ea;
  --sidebar-border: #2f3336;
  --sidebar-ring: #58d3db;

  --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.6);
  --shadow-pop: 0 12px 32px -12px rgba(0, 0, 0, 0.8);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-card: var(--shadow-card);
  --shadow-pop: var(--shadow-pop);

  --container-shell: 75rem;           /* 1200px */
  --container-prose: 68ch;            /* 65–75ch, design.md §Layout */

  --font-sans: var(--font-open-sans), "Open Sans", system-ui, sans-serif;
  --font-serif: Georgia, "Times New Roman", serif;
  --font-mono: Menlo, "DejaVu Sans Mono", ui-monospace, monospace;
}

/* Fokus dua lapis — aqua sendiri tidak cukup (1,79:1 di atas putih) */
@layer base {
  :focus-visible {
    outline: 2px solid var(--foreground);
    outline-offset: 2px;
    box-shadow: 0 0 0 4px var(--ring-halo);
  }
}
```

**Catatan implementasi font.** Open Sans dimuat lewat `next/font/google` (weight 400/500/600) sehingga berkasnya di-self-host saat build — tidak ada request runtime ke Google. Georgia dan Menlo adalah font sistem; keduanya punya fallback di Linux (`Times New Roman`/`serif`, `DejaVu Sans Mono`/`ui-monospace`).

---

## 3. Peta `design.md` → variabel shadcn

| `design.md` | Nilai | Variabel shadcn | Catatan |
| --- | --- | --- | --- |
| `background` | `#ffffff` | `--background` | — |
| `foreground` | `#000000` | `--foreground` | juga `--card-foreground`, `--popover-foreground` |
| `card` | `#f7f8f8` | `--card` | — |
| `primary` | `#58d3db` | `--primary`, `--ring`, `--sidebar-primary`, `--sidebar-ring` | — |
| `primary-foreground` | `#000000` | `--primary-foreground` | **jangan** diganti putih |
| `secondary` | `#202020` | `--secondary` | — |
| `secondary-foreground` | `#ffffff` | `--secondary-foreground` | — |
| `muted` | `#f1f5f9` | `--muted` | — |
| `muted-foreground` | `#323232` | `--muted-foreground` | teks sekunder |
| `accent` | `#e3ecf6` | `--accent`, `--sidebar-accent` | — |
| `accent-foreground` | `#323232` | `--accent-foreground` | — |
| `destructive` | `#f4212e` | `--destructive` | label memakai hitam (5,10:1) |
| — | `#000000` | `--destructive-foreground` | **turunan**, lihat §2 |
| `border` | `#e1eaef` | `--border`, `--sidebar-border` | dekoratif |
| `input` | `#f7f9fa` | `--input` | isi field |
| — | turunan | `--border-strong` | batas kontrol, ≥3:1 |
| `sidebar` | `#f7f8f8` | `--sidebar` | — |
| `chart-1..5` | aqua … merah | `--chart-1..5` | belum dipakai |
| `dark-*` | lihat §2 | blok `.dark` | 10 nilai; sisanya inversi token gelap |

**Tidak ada padanan `--coral`, `--free`, `--premium`, `--brand-*`.** Semantik lama (premium = coral, gratis = hijau) dipetakan ke token Celestial di §9 — bukan dengan menghidupkan kembali token lama.

> **Jebakan:** `--muted` di shadcn adalah **latar**, bukan teks. Selalu `text-muted-foreground` untuk teks sekunder, `bg-muted` untuk latar.

---

## 4. Skala tipografi

Diambil dari `design.md §typography`; tiga baris bertanda † adalah langkah turunan untuk kebutuhan UI yang tidak ada di file (H3, meta 12px, badge).

| Peran | Ukuran / line-height | Weight | Font | Kelas |
| --- | --- | --- | --- | --- |
| Display (hero) | 48 / 1,1 | 600 | Open Sans | `text-5xl font-semibold tracking-tight` |
| H1 (headline-lg) | 36 / 1,15 | 600 | Open Sans | `text-4xl font-semibold tracking-tight` |
| H2 (headline-md) | 24 / 1,25 | 600 | Open Sans | `text-2xl font-semibold` |
| H3 † | 18 / 1,4 | 600 | Open Sans | `text-lg font-semibold` |
| H4 / judul kartu | 16 / 1,5 | 600 | Open Sans | `text-base font-semibold` |
| Bacaan panjang (prose) | 18 / 1,65 | 400 | **Georgia** | `font-serif text-lg leading-relaxed` |
| UI / body | 16 / 1,5 | 400 | Open Sans | `text-base` |
| Body kecil | 14 / 1,5 | 400 | Open Sans | `text-sm` |
| Label & tombol | 14 / 1,4 | 500 | Open Sans | `text-sm font-medium` |
| Meta † | 12 / 1,4 | 500 | Open Sans | `text-xs font-medium` |
| Badge † | 12 / 1,3 | 600 | Open Sans | `text-xs font-semibold` |
| Kode | 13 / 1,5 | 400 | **Menlo** | `font-mono text-[13px]` |

Aturan turunan:

- **Georgia hanya untuk bacaan panjang** (deskripsi item, tutorial, kebijakan). Jangan untuk nav, tabel, atau label — `design.md` melarang tabel/nav serif.
- **Open Sans untuk semua chrome**: heading, tombol, label, tabel, badge.
- **Menlo untuk kode, ID, nomor order**. ID order `RT-…` memakai mono agar tidak salah baca.

---

## 5. Skala geometri

| Kategori | Nilai | Catatan |
| --- | --- | --- |
| Spacing | `4 8 16 24 32 48 64` (`1 2 4 6 8 12 16`) | skala 8px dari `design.md`; 4px hanya untuk ikon–teks |
| Radius | `sm` 4 · `md` 6 · `lg` 8 · `xl` 12 · `full` | kontrol 6, kartu 8; **bukan** pill kecuali chip/avatar |
| Border | `1px`; fokus `2px` | batas kontrol memakai `--border-strong` |
| Kontainer | `shell` 1200 · `prose` 68ch · `wide` 1440 (admin) | gutter 16 / 24 / 32 |
| Tinggi kontrol | `sm` 32 · `md` 40 · `lg` 48 | padding tombol 12px sesuai `design.md` |
| Ikon | 16 (`size-4`) · 20 (`size-5`) · 24 (`size-6`) | `lucide` |
| Bayangan | `--shadow-card`, `--shadow-pop` | dipakai hemat; `design.md` memilih border |
| Z-index | sticky 10 · dropdown 50 · sheet 60 · dialog 70 · toast 80 · skip-link 90 | — |
| Grid katalog | 1 < 640 · 2 @640 · 3 @1024 · 4 @1280 | di dalam shell 1200 |

---

## 6. Daftar komponen shadcn yang dipasang

```bash
npx shadcn@latest add accordion alert alert-dialog aspect-ratio avatar badge \
  breadcrumb button calendar card carousel checkbox collapsible command \
  context-menu dialog drawer dropdown-menu form hover-card input input-otp \
  label menubar navigation-menu pagination popover progress radio-group \
  resizable scroll-area select separator sheet sidebar skeleton slider \
  sonner switch table tabs textarea toggle toggle-group tooltip
```

| Tidak dipasang | Alasan |
| --- | --- |
| `chart` | Tidak ada grafik di v1; kartu statistik memakai angka |
| `toast` (lama) | Digantikan `sonner` |
| `toaster` | Cukup satu `<Toaster />` di root |
| `menubar`, `context-menu`, `navigation-menu`, `resizable` | Dipasang untuk kelengkapan, tidak dipakai di v1 |

---

## 7. Aturan pemakaian

1. **Dilarang membuat primitif sendiri.** Dropdown → `DropdownMenu`, panel samping → `Sheet`, konfirmasi → `AlertDialog`.
2. **Warna hanya dari token `design.md`.** Tidak ada hex baru, tidak ada palet kedua, tidak ada `#1f5139`/`#c8634a` yang tersisa dari acuan lama. Tiga nilai turunan disahkan: `--destructive-foreground` (hitam, token yang ada), `--border-strong`, dan `--ring-halo` (`color-mix` dari dua token).
3. **Jangan pernah teks putih di atas aqua** (`1,79:1`). `design.md` menyebutnya eksplisit; label aqua selalu hitam (`11,8:1`).
4. **Satu aksi primary per layar.** Aqua hanya untuk satu tombol utama; CTA kedua memakai `outline`/`ghost`/`secondary`.
5. **Jangan membanjiri latar dengan aqua.** Aqua untuk tombol, badge premium, ikon terpilih, dan indikator — bukan latar section atau header besar.
6. **`--border` bukan batas kontrol.** Input, checkbox, radio, select memakai `--border-strong` agar lolos 3:1.
7. **Fokus dua lapis:** `outline: 2px solid var(--foreground)` + `box-shadow: 0 0 0 4px var(--ring-halo)`. Aqua sendiri gagal 1,4:1 di atas putih, jadi bukan indikator tunggal.
8. **Dilarang `style={{}}`**; kelas arbitrer hanya `text-[13px]` dan `shadow-pop`.
9. **Varian lewat `cva`**, bukan kondisional string di JSX.
10. **Ikon hanya `lucide-react`**; tidak ada SVG inline baru.
11. **Komponen server by default**; `"use client"` hanya bila memakai state/effect/event.

---

## 8. Verifikasi kontras

Dihitung dengan formula WCAG 2.x dari nilai token (bukan perkiraan visual). Ambang: **4,5:1** teks normal, **3,0:1** teks besar dan non-teks.

| Kombinasi | Rasio | Normal | Besar/non-teks | Dipakai untuk |
| --- | --- | --- | --- | --- |
| Hitam di `--background` | **21,0:1** | AAA | AAA | Semua teks utama |
| Hitam di `--card` | **19,7:1** | AAA | AAA | Teks di kartu |
| Putih di `--secondary` | **16,3:1** | AAA | AAA | Tombol secondary, header gelap |
| `--muted-foreground` di `--background` | **12,8:1** | AAA | AAA | Teks sekunder, meta |
| `--muted-foreground` di `--muted` | **11,7:1** | AAA | AAA | Teks di panel muted |
| Hitam di `--primary` (aqua) | **11,8:1** | AAA | AAA | **Semua label di atas aqua** |
| `--accent-foreground` di `--accent` | **10,7:1** | AAA | AAA | Chip terpilih, badge status |
| `--border-strong` di `--background` | **3,4:1** | — | Lolos | Batas input/checkbox/radio |
| Hitam di `--destructive` | **5,10:1** | Lolos | Lolos | Label tombol & badge destruktif |
| Putih di `--destructive` | **4,11:1** | **Gagal** | Lolos | **Dilarang** untuk label |
| `--destructive` di `--background` | **4,11:1** | **Gagal** | Lolos | Ikon/border saja, bukan teks error kecil |
| `--primary` di `--background` | **1,79:1** | Gagal | **Gagal** | **Bukan** warna teks; bukan indikator fokus tunggal |
| `--border` di `--background` | **1,22:1** | — | Gagal | Dekoratif (garis kartu), bukan batas kontrol |
| `--muted` di `--background` | **1,10:1** | — | — | Hanya latar; jangan diandalkan sebagai satu-satunya pembeda |

Mode gelap (blok `.dark`, belum dikirim):

| Kombinasi | Rasio |
| --- | --- |
| `#e7e9ea` di `#121212` | **15,4:1** |
| `#e7e9ea` di `#17181c` | **14,6:1** |
| Hitam di aqua `#58d3db` | **11,8:1** |
| Aqua di `#121212` | **10,5:1** |
| `#8b98a5` di `#17181c` | **6,0:1** |
| `--border-strong` di `#121212` | **4,5:1** |
| Hitam di `#f4212e` | **5,10:1** |

**Tiga temuan yang harus dipegang:**

1. **Putih di atas aqua tidak boleh** (1,79:1) — ini juga aturan tertulis `design.md`.
2. **Putih di atas merah gagal** (4,11:1), jadi label destruktif **hitam**. Terlihat tidak biasa, tetapi ini satu-satunya cara memakai `#f4212e` tanpa melanggar AA, dan tidak menambah warna.
3. **`--border` 1,22:1 tidak cukup untuk batas kontrol.** Karena itu ada `--border-strong` (3,4:1) untuk input/checkbox/radio/select; `--border` tetap untuk garis kartu dan tabel.

CI menjalankan `axe` pada 6 halaman (lihat `07-test-plan.md` §5.2). Bila hasil CI berbeda, **CI yang menang** dan tabel diperbaiki.

---

## 9. Pemetaan semantik produk → token Celestial

Palet lama punya coral (premium) dan hijau (gratis). Celestial hanya punya aqua, abu, dan merah — jadi perbedaan jalur gratis/premium **tidak lagi dibawa oleh warna**, melainkan oleh bentuk kontrol, ikon, dan kata.

### 9.1 Tombol

| Varian | Latar | Teks | Rasio | Kapan |
| --- | --- | --- | --- | --- |
| `primary` | `--primary` (aqua) | `--primary-foreground` (hitam) | 11,8:1 | **Satu per layar**: `Beli Source Code`, `Download Tanpa Iklan`, `Masuk` |
| `secondary` | `--secondary` (#202020) | putih | 16,3:1 | Aksi tegas non-utama (mis. `Kirim Request` di halaman form) |
| `outline` | transparan + `--border-strong` | `--foreground` | 21:1 | Aksi sekunder: `Batal`, `Filter`, `Download Gratis` |
| `ghost` | transparan | `--foreground` | 21:1 | Aksi dalam tabel, tutup dialog |
| `destructive` | `--destructive` | `--destructive-foreground` (hitam) | 5,10:1 | Konfirmasi final di `AlertDialog` |
| `destructiveOutline` | transparan + border `--destructive` | `--foreground` + ikon merah | 21:1 | Refund/Hapus inline di tabel |

**Dua jalur unduhan di halaman detail:**

- Berbayar = `primary` (aqua, hitam) — satu-satunya aqua di layar itu.
- Gratis = `outline` + tautan teks bergaris bawah "lewat iklan".

Tidak ada lagi dua tombol berwarna bersaing; yang membedakan adalah **posisi, bentuk, dan label**.

### 9.2 Badge

| Tone | Latar | Teks | Ikon | Contoh |
| --- | --- | --- | --- | --- |
| `premium` | `--primary` (aqua) | hitam | `Sparkles` | `Premium` |
| `free` | transparan + border `--border-strong` | `--foreground` | — | `Gratis` |
| `neutral` | `--muted` | `--muted-foreground` | — | `Draf`, `Arsip` |
| `success` | `--accent` | `--accent-foreground` | `CircleCheck` | `Terbit`, `Lunas` |
| `warning` | `--accent` | `--accent-foreground` | `Clock` | `Menunggu`, `Kedaluwarsa` |
| `danger` | `--destructive` | hitam | `AlertTriangle` | `Gagal`, `Ditolak` |

`success` dan `warning` berbagi latar; pembeda wajib **ikon + kata** (WCAG 1.4.1). `free` sengaja tanpa isi warna: badge gratis harus terasa lebih tenang daripada badge premium.

### 9.3 Fokus, input, dan keadaan non-aktif

| Hal | Aturan | Alasan |
| --- | --- | --- |
| Focus ring | Utility `focus-ring`: `outline: 2px solid var(--foreground); outline-offset: 2px;` + `box-shadow: 0 0 0 4px var(--ring-halo)` | aqua 1,79:1 gagal sebagai indikator tunggal; `ring-2 ring-ring` bawaan shadcn **diganti** utility ini. Dideklarasikan `@utility focus-ring`; `outline` memakai `!important` agar menang atas `outline-none` di 45 primitif CLI |
| Input | `bg-input` + `border border-border-strong` | `--border` 1,22:1 gagal 1.4.11 |
| Placeholder | `text-muted-foreground` | 12,8:1, bukan abu pucat |
| Disabled | `bg-muted text-muted-foreground` — **tanpa** `opacity-50` | opacity menurunkan kontras di bawah AA |
| Selected (chip/tab) | `bg-accent text-accent-foreground` | 10,7:1 |
| Link dalam teks | `underline underline-offset-4` + `--foreground` | aqua tidak terbaca sebagai teks (1,79:1) |

### 9.4 Yang dilarang

| Dilarang | Alasan |
| --- | --- |
| `text-primary` untuk teks/link | 1,79:1 di atas putih |
| `bg-primary` untuk section/hero besar | melanggar "don't flood backgrounds with aqua" |
| Putih di atas aqua | 1,79:1, eksplisit dilarang `design.md` |
| `text-destructive` untuk pesan error 14px | 4,11:1; pakai `--foreground` + ikon merah |
| `border-border` pada input | 1,22:1; pakai `--border-strong` |
| Menghidupkan kembali `--coral`, `--free`, `--brand-*` | palet acuan lama sudah tidak berlaku |
| `opacity-50` untuk disabled | menurunkan kontras |

---

## 10. Belum diputuskan

| Hal | Status |
| --- | --- |
| Logo & wordmark Reditech | Belum ada; arah visual: tanda hitam di atas putih, aksen aqua |
| Toggle mode gelap | Token `.dark` siap; toggle ditunda ke v1.1 |
| Ikon kustom kategori | Tidak perlu; `lucide` |
| Densitas tabel admin | Default `comfortable`; toggle ditunda |
| Storybook | Tidak dipakai; pratinjau lewat `/dev/components` (lihat `11-component-inventory.md` §12) |
| Grafik admin | `--chart-*` disiapkan tetapi komponen `chart` belum dipasang |
