-- Invariant yang tidak dapat dinyatakan di `schema.prisma` — `03-data-model.md` §3.
-- Dijalankan setelah migrasi init; seluruh isinya idempoten terhadap data kosong
-- karena hanya menambah constraint, indeks, dan ekstensi.

-- ─────────────────────── Ekstensi & pencarian ───────────────────────

-- pg_trgm dipakai untuk pencarian samar (`similarity`, GIN title).
-- Butuh hak superuser; di Docker Compose resmi, POSTGRES_USER memilikinya.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─────────────────────── INV-01 & INV-02 ───────────────────────
-- FREE    ⇒ priceIdr IS NULL  dan noAdsPriceIdr > 0
-- PREMIUM ⇒ priceIdr > 0      dan noAdsPriceIdr IS NULL

ALTER TABLE "items"
  ADD CONSTRAINT "items_price_by_type" CHECK (
    ("type" = 'FREE'    AND "priceIdr" IS NULL AND "noAdsPriceIdr" > 0) OR
    ("type" = 'PREMIUM' AND "priceIdr" > 0    AND "noAdsPriceIdr" IS NULL)
  );

-- ─────────────────────────── INV-03 ───────────────────────────

ALTER TABLE "items"
  ADD CONSTRAINT "items_published_at" CHECK (
    "status" <> 'PUBLISHED' OR "publishedAt" IS NOT NULL
  );

ALTER TABLE "items"
  ADD CONSTRAINT "items_download_count_non_negative" CHECK ("downloadCount" >= 0);

-- ─────────────────────── INV-04 & INV-11 ─────────────────────

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_total_match" CHECK (
    "totalIdr" = "subtotalIdr" + "serviceFeeIdr"
  );

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_amounts_non_negative" CHECK (
    "subtotalIdr" >= 0 AND "serviceFeeIdr" >= 0 AND "totalIdr" >= 0
  );

-- ─────────────────────────── INV-06 ───────────────────────────
-- Satu entitlement aktif per (userId, itemId). Partial index, bukan UNIQUE
-- penuh, agar grant ulang setelah revoke/refund tetap mungkin.

CREATE UNIQUE INDEX "entitlements_active_unique"
  ON "entitlements" ("userId", "itemId")
  WHERE "revokedAt" IS NULL;

-- ─────────────────────────── INV-07 ───────────────────────────
-- Penukaran token tetap memakai UPDATE bersyarat atomik; CHECK ini jaring
-- pengaman bila ada jalur kode yang lupa memeriksanya.

ALTER TABLE "download_tokens"
  ADD CONSTRAINT "download_tokens_uses_within_limit" CHECK ("uses" <= "maxUses");

-- ─────────────────────────── INV-10 ───────────────────────────
-- Audit hanya boleh ditambah. Role aplikasi di produksi bernama `app_role`
-- (lihat 00-tech-stack.md §7); di lokal, role pemilik database dilewati agar
-- migrasi tidak gagal.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_role') THEN
    REVOKE UPDATE, DELETE ON "admin_audit_logs" FROM app_role;
  END IF;
END
$$;

-- ─────────────────── Indeks pencarian katalog ───────────────────
-- `03-data-model.md` §4. Ekspresi memakai konfigurasi konstan sehingga
-- dianggap immutable dan boleh diindeks.

CREATE INDEX "items_search_tsv_idx" ON "items"
  USING GIN (to_tsvector('indonesian'::regconfig, "title" || ' ' || "shortDescription"));

CREATE INDEX "items_title_trgm_idx" ON "items"
  USING GIN ("title" gin_trgm_ops);
