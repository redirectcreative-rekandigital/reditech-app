import { PrismaClient, type Prisma } from "@prisma/client";

/**
 * Seed minimum — `03-data-model.md` §5.
 * Idempoten: semua penulisan memakai `upsert` berdasarkan kunci natural
 * (email, slug, key), sehingga aman dijalankan berulang di staging.
 */

const prisma = new PrismaClient();

const SUPERADMIN_EMAIL = process.env.SEED_SUPERADMIN_EMAIL ?? "admin@reditech.id";

const categories = [
  { name: "CodeIgniter", slug: "codeigniter", order: 1 },
  { name: "Google Apps Script", slug: "gas", order: 2 },
  { name: "Java", slug: "java", order: 3 },
  { name: "Laravel", slug: "laravel", order: 4 },
  { name: "Mobile App", slug: "mobile-app", order: 5 },
  { name: "Native PHP", slug: "native-php", order: 6 },
  { name: "Next.js", slug: "nextjs", order: 7 },
  { name: "PHP", slug: "php", order: 8 },
  { name: "Python", slug: "python", order: 9 },
  { name: "WordPress", slug: "wordpress", order: 10 },
];

const technologies = [
  "PHP",
  "Laravel",
  "Next.js",
  "Python",
  "Java",
  "WordPress",
  "Google Apps Script",
  "CodeIgniter",
  "React Native",
  "Flutter",
];

const settings: Array<{ key: string; value: Prisma.InputJsonValue }> = [
  { key: "pricing.noAdsPriceIdr", value: 3000 },
  { key: "pricing.serviceFeeIdr", value: 21 },
  { key: "ads.interstitialSeconds", value: 10 },
  { key: "security.downloadDailyLimit", value: 5 },
  { key: "payment.expiryMinutes", value: 1440 },
];

const items = [
  {
    slug: "pos-kasir-laravel",
    title: "Aplikasi POS Kasir Laravel",
    type: "FREE" as const,
    categorySlug: "laravel",
    shortDescription:
      "Kasir toko dengan produk, stok, dan laporan harian. Cocok untuk warung sampai toko kelontong.",
    description:
      "Aplikasi point of sale berbasis Laravel 11 dan MySQL. Mencakup manajemen produk, stok masuk-keluar, transaksi tunai dan QRIS manual, cetak struk 58 mm, serta laporan penjualan harian dan bulanan.\n\nStruktur kode mengikuti pola controller tipis dan service class, sehingga mudah ditambah metode pembayaran lain.",
    howItWorks:
      "Unggah ke hosting PHP 8.2, impor berkas SQL, atur kredensial database di .env, lalu jalankan migrasi. Akun kasir pertama dibuat lewat perintah artisan yang disertakan.",
    license: "MIT",
    priceIdr: null,
    noAdsPriceIdr: 3000,
    featured: true,
    technologies: ["Laravel", "PHP"],
    features: [
      "Transaksi tunai dan QRIS manual",
      "Manajemen stok dengan riwayat pergerakan",
      "Laporan penjualan harian dan bulanan",
    ],
    steps: [
      {
        title: "Siapkan lingkungan",
        body: "Butuh PHP 8.2, Composer, dan MySQL 8. Salin .env.example menjadi .env lalu isi kredensial database.",
      },
      {
        title: "Migrasi dan seed",
        body: "Jalankan `php artisan migrate --seed`, lalu buat akun kasir dengan `php artisan kasir:buat`.",
      },
    ],
  },
  {
    slug: "undangan-digital-nextjs",
    title: "Undangan Digital Next.js",
    type: "PREMIUM" as const,
    categorySlug: "nextjs",
    shortDescription:
      "Undangan pernikahan online dengan RSVP, galeri, dan hitung mundur. Siap deploy ke Vercel.",
    description:
      "Template undangan digital dengan halaman utama beranimasi ringan, formulir RSVP yang tersimpan ke database, galeri foto, dan hitung mundur acara.\n\nTermasuk panel sederhana untuk mengganti nama, tanggal, lokasi, dan daftar tamu tanpa menyentuh kode.",
    howItWorks:
      "Deploy ke Vercel, hubungkan PostgreSQL, lalu isi data acara di panel /atur. Domain kustom dapat dipasang dari dasbor Vercel.",
    license: "Lisensi komersial satu domain",
    priceIdr: 49000,
    noAdsPriceIdr: null,
    featured: false,
    technologies: ["Next.js", "React Native"],
    features: [
      "RSVP tersimpan di database",
      "Galeri foto dan hitung mundur acara",
      "Panel pengaturan tanpa menyentuh kode",
    ],
    steps: [
      {
        title: "Deploy",
        body: "Impor repositori ke Vercel, tambahkan DATABASE_URL, lalu deploy. Migrasi dijalankan otomatis saat build pertama.",
      },
      {
        title: "Isi data acara",
        body: "Buka /atur dengan akun pemilik, isi nama mempelai, tanggal, lokasi, dan unggah galeri.",
      },
    ],
  },
  {
    slug: "erp-gudang-laravel",
    title: "ERP Gudang Laravel",
    type: "PREMIUM" as const,
    categorySlug: "laravel",
    shortDescription:
      "Multi-gudang, purchase order, dan transfer stok dengan jejak audit lengkap untuk distributor.",
    description:
      "Sistem ERP gudang untuk distributor menengah: master barang dengan banyak satuan, purchase order ke pemasok, penerimaan barang, transfer antargudang, dan penyesuaian stok opname.\n\nSetiap pergerakan stok tercatat dengan pelaku dan waktu, sehingga stok fisik dapat direkonsiliasi kapan saja.",
    howItWorks:
      "Jalankan dengan Docker Compose yang disertakan: `docker compose up -d`, lalu buka /install untuk membuat perusahaan dan gudang pertama.",
    license: "Lisensi komersial satu perusahaan",
    priceIdr: 249000,
    noAdsPriceIdr: null,
    featured: true,
    technologies: ["Laravel", "PHP"],
    features: [
      "Multi-gudang dengan transfer dan opname",
      "Purchase order dan penerimaan barang",
      "Jejak audit setiap pergerakan stok",
    ],
    steps: [
      {
        title: "Jalankan",
        body: "Salin .env.example, jalankan `docker compose up -d`, lalu `docker compose exec app php artisan migrate --seed`.",
      },
      {
        title: "Buat perusahaan",
        body: "Buka /install, isi data perusahaan dan gudang pertama, lalu undang staf lewat menu Pengguna.",
      },
    ],
  },
];

const tutorials = [
  {
    slug: "deploy-nextjs-vps-docker",
    title: "Deploy Next.js ke VPS dengan Docker dan Caddy",
    excerpt:
      "Alur lengkap dari build multi-stage sampai HTTPS otomatis, termasuk healthcheck dan rollback.",
    readMinutes: 9,
    tags: ["Next.js"],
    content: `## Ringkas\n\nDeploy Next.js ke VPS tidak butuh platform khusus. Yang dibutuhkan hanya Docker, Caddy sebagai reverse proxy, dan satu domain yang sudah diarahkan ke IP VPS.\n\n## Langkah\n\n1. Build image multi-stage agar node_modules tidak ikut ke produksi.\n2. Jalankan dua kontainer (biru/hijau) dan arahkan Caddy ke salah satunya.\n3. Pindahkan trafik setelah healthcheck lulus.\n\n## Rollback\n\nSimpan tag image sebelumnya. Bila healthcheck gagal, arahkan Caddy kembali ke tag lama — prosesnya di bawah satu detik.`,
  },
  {
    slug: "optimasi-query-laravel",
    title: "Menghilangkan N+1 Query di Laravel",
    excerpt:
      "Tiga pola eager loading yang menyelamatkan halaman daftar dari ratusan query tanpa disadari.",
    readMinutes: 6,
    tags: ["Laravel", "PHP"],
    content: `## Kenapa N+1 mahal\n\nSeratus baris daftar dengan satu relasi berarti seratus satu query. Waktu tempuhnya bukan penjumlahan linear, karena tiap query punya biaya perjalanan jaringan.\n\n## Tiga pola\n\n- \`with()\` untuk relasi yang selalu ditampilkan.\n- \`withCount()\` bila hanya butuh jumlah.\n- \`loadMissing()\` untuk relasi yang kadang dipakai.\n\n## Verifikasi\n\nAktifkan \`DB::listen\` di lingkungan lokal dan hitung query per halaman. Angka itu yang jadi patokan, bukan perasaan.`,
  },
];

async function main() {
  const superadmin = await prisma.user.upsert({
    where: { email: SUPERADMIN_EMAIL },
    update: { role: "SUPERADMIN", status: "ACTIVE" },
    // Tanpa passwordHash: masuk lewat Google OAuth atau undangan admin.
    create: {
      email: SUPERADMIN_EMAIL,
      name: "Superadmin Reditech",
      role: "SUPERADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, order: category.order, isActive: true },
      create: category,
    });
  }

  const technologyIds = new Map<string, string>();
  for (const name of technologies) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const technology = await prisma.technology.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    technologyIds.set(name, technology.id);
  }

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    });
  }

  for (const item of items) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: item.categorySlug },
    });

    const data = {
      title: item.title,
      type: item.type,
      status: "PUBLISHED" as const,
      shortDescription: item.shortDescription,
      description: item.description,
      howItWorks: item.howItWorks,
      license: item.license,
      priceIdr: item.priceIdr,
      noAdsPriceIdr: item.noAdsPriceIdr,
      featured: item.featured,
      publishedAt: new Date("2026-10-01T00:00:00.000Z"),
      releasedAt: new Date("2026-09-01T00:00:00.000Z"),
      categoryId: category.id,
    };

    const saved = await prisma.item.upsert({
      where: { slug: item.slug },
      update: data,
      create: { slug: item.slug, ...data },
    });

    // Anak-anak item ditulis ulang agar seed tetap idempoten.
    await prisma.itemFeature.deleteMany({ where: { itemId: saved.id } });
    await prisma.itemFeature.createMany({
      data: item.features.map((text, index) => ({
        itemId: saved.id,
        order: index + 1,
        text,
      })),
    });

    await prisma.itemInstallationStep.deleteMany({ where: { itemId: saved.id } });
    await prisma.itemInstallationStep.createMany({
      data: item.steps.map((step, index) => ({
        itemId: saved.id,
        order: index + 1,
        title: step.title,
        body: step.body,
      })),
    });

    for (const name of item.technologies) {
      const technologyId = technologyIds.get(name);
      if (!technologyId) throw new Error(`Teknologi tidak dikenal: ${name}`);
      await prisma.itemTechnology.upsert({
        where: { itemId_technologyId: { itemId: saved.id, technologyId } },
        update: {},
        create: { itemId: saved.id, technologyId },
      });
    }
  }

  for (const tutorial of tutorials) {
    const saved = await prisma.tutorial.upsert({
      where: { slug: tutorial.slug },
      update: {
        title: tutorial.title,
        excerpt: tutorial.excerpt,
        content: tutorial.content,
        readMinutes: tutorial.readMinutes,
        status: "PUBLISHED",
        publishedAt: new Date("2026-10-05T00:00:00.000Z"),
      },
      create: {
        slug: tutorial.slug,
        title: tutorial.title,
        excerpt: tutorial.excerpt,
        content: tutorial.content,
        readMinutes: tutorial.readMinutes,
        status: "PUBLISHED",
        publishedAt: new Date("2026-10-05T00:00:00.000Z"),
        authorId: superadmin.id,
      },
    });

    for (const name of tutorial.tags) {
      const technologyId = technologyIds.get(name);
      if (!technologyId) throw new Error(`Teknologi tidak dikenal: ${name}`);
      await prisma.tutorialTag.upsert({
        where: {
          tutorialId_technologyId: { tutorialId: saved.id, technologyId },
        },
        update: {},
        create: { tutorialId: saved.id, technologyId },
      });
    }
  }

  console.log(
    `Seed selesai: ${categories.length} kategori, ${technologies.length} teknologi, ` +
      `${items.length} item, ${tutorials.length} tutorial, ${settings.length} setting.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
