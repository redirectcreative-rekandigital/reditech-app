# Deployment & Operasi

| Field | Isi |
| --- | --- |
| Target | 1 VPS (4 vCPU / 8 GB / 100 GB SSD) di Indonesia/Singapura |
| Runtime | Docker Compose, tanpa orchestrator |
| Edge | Cloudflare (proxied, WAF, cache aset) |
| Rilis | Blue-green dua container aplikasi di belakang Caddy |

---

## 1. Topologi

```mermaid
flowchart TD
    U[Pengguna] --> CF[Cloudflare<br/>WAF · HTTP/3 · cache aset]
    CF --> CAD[Caddy :443<br/>TLS origin]
    CAD --> BLUE[app_blue]
    CAD --> GREEN[app_green]
    BLUE & GREEN --> PG[(PostgreSQL 16)]
    BLUE & GREEN --> RD[(Redis 7)]
    BLUE --> R2[(Cloudflare R2<br/>gambar)]
    BLUE --> GD[(Google Drive<br/>berkas source code)]
    BLUE --> DOKU[DOKU API]
    BLUE --> MAIL[SMTP relay]
    CRON[cron container] --> PG
    CRON --> RD
```

Catatan: hanya satu container yang aktif melayani trafik; yang lain standby untuk rilis berikutnya dan rollback instan.

---

## 2. Docker Compose (produksi)

```yaml
name: reditech

services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
    depends_on: [app_blue]

  app_blue:
    image: ghcr.io/ORG/reditech:${TAG:-latest}
    restart: unless-stopped
    env_file: [.env.production]
    environment:
      NODE_ENV: production
      PORT: "3000"
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 40s
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_started }

  app_green:
    image: ghcr.io/ORG/reditech:${TAG:-latest}
    profiles: ["standby"]
    restart: unless-stopped
    env_file: [.env.production]
    environment: { NODE_ENV: production, PORT: "3000" }
    healthcheck: *app_health

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: reditech
      POSTGRES_USER: app
      POSTGRES_PASSWORD_FILE: /run/secrets/pg_password
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./backups:/backups
    secrets: [pg_password]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d reditech"]
      interval: 10s
      retries: 5
    command:
      - postgres
      - -c
      - max_connections=100
      - -c
      - shared_buffers=1GB
      - -c
      - work_mem=16MB

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes", "--maxmemory", "512mb", "--maxmemory-policy", "allkeys-lru"]
    volumes: [redis_data:/data]

  cron:
    image: ghcr.io/ORG/reditech:${TAG:-latest}
    restart: unless-stopped
    env_file: [.env.production]
    command: ["node", "dist/jobs/runner.js"]
    depends_on:
      postgres: { condition: service_healthy }

volumes:
  pg_data:
  redis_data:
  caddy_data:

secrets:
  pg_password:
    file: ./secrets/pg_password.txt
```

`Caddyfile`:

```
reditech.id {
  redir https://www.reditech.id{uri} permanent
}

www.reditech.id {
  encode zstd gzip
  reverse_proxy app_blue:3000
  header {
    Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    X-Content-Type-Options "nosniff"
    X-Frame-Options "SAMEORIGIN"
    Referrer-Policy "strict-origin-when-cross-origin"
    Permissions-Policy "camera=(), microphone=(), geolocation=()"
    -Server
  }
}
```

Catatan: `www` adalah kanonik. Semua URL absolut (canonical, sitemap, `NEXTAUTH_URL`, tautan email) memakai `https://www.reditech.id`, dan apex mengalihkan `308` ke sana.

---

## 3. Variabel lingkungan

| Kunci | Wajib | Catatan |
| --- | --- | --- |
| `DATABASE_URL` | ✔ | `postgresql://app:***@postgres:5432/reditech` |
| `REDIS_URL` | ✔ | `redis://redis:6379` |
| `AUTH_SECRET` | ✔ | 32 byte acak base64; rotasi 12 bulan |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | ✔ | OAuth client |
| `NEXTAUTH_URL` | ✔ | `https://www.reditech.id` |
| `DOKU_CLIENT_ID` / `DOKU_SECRET` | ✔ | Sandbox vs produksi dibedakan eksplisit |
| `DOKU_IS_PRODUCTION` | ✔ | `true` hanya di produksi |
| `GOOGLE_DRIVE_SA_JSON` | ✔ | Kredensial service account (base64 JSON) |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | ✔ | Folder induk berkas item |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY` / `R2_SECRET` / `R2_BUCKET` / `R2_PUBLIC_URL` | ✔ | Gambar |
| `SMTP_URL` | ✔ | `smtps://user:pass@smtp.host:465` |
| `MFA_ENCRYPTION_KEY` | ✔ | 32 byte, untuk `mfaSecretEnc` |
| `IP_HASH_SALT` | ✔ | Untuk `ipHash`; rotasi akan memutus korelasi lama |
| `SENTRY_DSN` | – | Kosong = observabilitas minimal |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | – | Kosong = iklan nonaktif, interstisial tetap berjalan |
| `TZ` | ✔ | `Asia/Jakarta` (penting untuk cron & tanggal) |

Aturan: rahasia tidak pernah masuk image, tidak pernah ke repo, dan tidak dicetak di log. `.env.production` bermode `600`, pemilik `deploy`.

---

## 4. CI/CD

```mermaid
flowchart LR
  A[push / PR] --> B[lint + typecheck]
  B --> C[unit test]
  C --> D[integrasi test<br/>Postgres service]
  D --> E[build image]
  E --> F{branch main?}
  F -->|tidak| G[artifact + pratinjau opsional]
  F -->|ya| H[push GHCR :SHA]
  H --> I[migrate deploy ke staging]
  I --> J[smoke test staging]
  J --> K[deploy produksi: green]
  K --> L[health check]
  L -->|gagal| M[rollback ke blue]
  L -->|lulus| N[switch Caddy ke green]
```

Detail penting:

- **Migrasi harus kompatibel mundur** (expand → deploy → contract). Jangan `DROP COLUMN` pada rilis yang sama dengan penghapusan kode; tunggu satu rilis.
- Migrasi dijalankan sebagai langkah terpisah (`node dist/scripts/migrate.js`) sebelum switch trafik, dengan `lock_timeout=5s` agar tidak mengunci tabel lama.
- Smoke test pasca-deploy: `/api/health` 200, katalog 200 + memuat 12 kartu, satu halaman detail 200, `/admin` tanpa sesi → 307/403.
- Rollback: arahkan Caddy ke container sebelumnya (butuh < 30 detik). Rollback DB hanya bila migrasi tidak kompatibel — karena itu migrasi dirancang kompatibel.

---

## 5. Pekerjaan terjadwal (cron)

| Job | Jadwal | Aksi | Idempoten |
| --- | --- | --- | --- |
| `expire-orders` | tiap 5 menit | `PENDING` melewati `expiresAt` → `EXPIRED` | ya |
| `reconcile-orders` | tiap 10 menit | `PENDING` > 10 menit → query DOKU, sinkronkan | ya |
| `retry-emails` | tiap 5 menit | Kirim ulang `EmailLog(QUEUED)` maks 3× | ya |
| `cleanup-tokens` | harian 03.00 | Hapus `DownloadToken` kedaluwarsa > 7 hari | ya |
| `purge-archived` | harian 03.30 | Hapus permanen konten `ARCHIVED` > 30 hari + laporkan | ya |
| `expire-sponsors` | tiap jam | `ACTIVE` melewati `endsAt` → `EXPIRED` | ya |
| `drive-health` | tiap jam | Baca metadata 1 berkas acak; gagal → alert | ya |
| `stats-rollup` | harian 04.00 | Agregasi unduhan/pendapatan harian | ya |
| `backup-db` | harian 02.00 | `pg_dump` terenkripsi → R2 | ya |

Semua job memakai lock Redis (`SET NX PX`) agar tidak berjalan ganda saat container ganda.

---

## 6. Backup & pemulihan

| Aspek | Kebijakan |
| --- | --- |
| Backup penuh | `pg_dump -Fc` harian, terenkripsi age/gpg, ke R2 |
| WAL | Arsip tiap 15 menit (`archive_command` ke R2) → RPO ±15 menit |
| Retensi | 7 harian, 4 mingguan, 12 bulanan |
| Uji restore | Bulanan ke DB sementara; catat waktu (target < 4 jam) |
| Berkas Drive | Tidak di-backup (milik Google); dicatat `driveFileId` + `checksum` |
| Gambar R2 | Versioning bucket aktif 30 hari |
| Rahasia | Disimpan di password manager pemilik, bukan hanya di VPS |

Prosedur restore:

```bash
# 1. Siapkan DB kosong
docker compose stop app_blue
docker compose run --rm postgres createdb -U app reditech_restore

# 2. Pulihkan dump terbaru
docker compose run --rm -v $PWD/backups:/b postgres \
  pg_restore -U app -d reditech_restore --clean --if-exists /b/latest.dump

# 3. Verifikasi
docker compose run --rm postgres psql -U app -d reditech_restore \
  -c "select count(*) from items; select count(*) from orders;"

# 4. Tukar nama DB, jalankan migrasi, nyalakan app
```

---

## 7. Observabilitas

| Sinyal | Sumber | Ambang alert |
| --- | --- | --- |
| Error rate 5xx | Log + Sentry | > 1% selama 5 menit |
| Latensi origin p95 | Log akses | > 800 ms selama 10 menit |
| Webhook gagal | `PaymentEvent.error` | > 3 dalam 10 menit |
| Order PAID belum FULFILLED | Query | > 5 menit |
| Drive error | `Download(ERROR)` | > 5 dalam 5 menit |
| Koneksi DB | `pg_stat_activity` | > 80 kapasitas |
| Disk | Node exporter | > 85% |
| Sertifikat | Caddy | < 14 hari |
| Cron mati | Heartbeat Redis | > 2× interval |

Format log: JSON satu baris dengan `requestId`, `route`, `status`, `durationMs`, `userId?` (bukan email). Retensi log 14 hari di VPS, 90 hari di R2.

---

## 8. Runbook insiden

### 8.1 Situs 5xx massal

1. Cek `/api/health` → komponen mana yang merah.
2. Bila DB: cek disk, koneksi, dan log Postgres; restart `postgres` bila perlu (container restart < 20 s).
3. Bila app: rollback ke container sebelumnya (`switch upstream`), lalu selidiki.
4. Bila Cloudflare: aktifkan "Under Attack"/maintenance page dari dashboard.
5. Komunikasi: status sederhana di halaman `/` (banner) bila gangguan > 15 menit.

### 8.2 Unduhan gagal semua

1. Cek `drive-health` dan log `Download(ERROR)`.
2. Uji manual: baca metadata satu `driveFileId` dengan kredensial service account.
3. Bila kuota/ToS: aktifkan mode darurat — `Setting.ads.enabled` tidak relevan; tampilkan pesan "Unduhan sedang dalam pemeliharaan" pada tombol unduhan, bukan 500.
4. Eskalasi ke ADR-002 (migrasi R2) bila gangguan > 24 jam.

### 8.3 Pembayaran masuk tapi akses tidak terbit

1. Buka `/admin/pesanan/[orderNo]` → cek `PaymentEvent`.
2. Bila event ada tapi `processedAt` null: jalankan ulang pemrosesan (idempoten).
3. Bila event tidak ada: `Sync` ke DOKU; bila gateway menyatakan PAID, tandai lunas manual dengan bukti + alasan (audit).
4. Akar masalah dicatat; jangan menambal tanpa audit.

### 8.4 Dugaan kebocoran akun admin

1. Nonaktifkan akun (`user.suspend`), cabut semua sesi.
2. Rotasi `AUTH_SECRET` (memaksa logout semua), `DOKU_SECRET`, kredensial Drive.
3. Periksa `AdminAuditLog` 30 hari terakhir untuk aksi di luar kebiasaan.
4. Bila ada perubahan harga/konten mencurigakan: pulihkan dari `Revision`.

---

## 9. Jalur pertumbuhan

| Ambang | Tindakan |
| --- | --- |
| Origin CPU > 70% konsisten | Pisahkan Postgres ke instance sendiri |
| Trafik baca > 500 rps | Tambah replika baca + naikkan cache HTML untuk halaman publik yang aman |
| Berkas > 20 GB atau unduhan > 5.000/hari | Migrasi ke R2 (ADR-002) |
| > 50.000 item | Tinjau ulang indeks; pertimbangkan Meilisearch |
| Butuh multi-region | Pindah ke platform terkelola (Vercel/Fly) — tinjau ulang ADR hosting |

---

## 10. Serah terima

- Akses produksi dipegang pemilik; developer hanya mendapat akses sementara.
- Dokumen ini + `07-test-plan.md` §7 menjadi checklist serah terima.
- Satu sesi rekaman (30 menit) demonstrasi panel admin untuk pemilik.
- Tidak ada kredensial di dalam dokumen ini; semua nilai rahasia berada di password manager.
