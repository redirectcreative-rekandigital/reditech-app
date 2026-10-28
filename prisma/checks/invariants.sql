-- Verifikasi INV-01..07 dan indeks pencarian pada PostgreSQL sungguhan.
-- Semua baris uji di-rollback; database tidak berubah.

\set ON_ERROR_STOP on

BEGIN;

-- ─── INV-01: FREE tidak boleh punya priceIdr ───
DO $$
BEGIN
  BEGIN
    INSERT INTO items (id, slug, title, type, "shortDescription", description, "updatedAt", "priceIdr", "noAdsPriceIdr")
    VALUES ('t1', 'uji-inv01', 'Uji INV-01', 'FREE', 'x', 'x', now(), 1000, 3000);
    RAISE EXCEPTION 'GAGAL: INV-01 lolos';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'OK  INV-01 FREE + priceIdr ditolak';
  END;
END $$;

-- ─── INV-02: PREMIUM wajib priceIdr > 0 ───
DO $$
BEGIN
  BEGIN
    INSERT INTO items (id, slug, title, type, "shortDescription", description, "updatedAt", "priceIdr")
    VALUES ('t2', 'uji-inv02', 'Uji INV-02', 'PREMIUM', 'x', 'x', now(), 0);
    RAISE EXCEPTION 'GAGAL: INV-02 lolos';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'OK  INV-02 PREMIUM + priceIdr=0 ditolak';
  END;
END $$;

-- ─── INV-03: PUBLISHED wajib publishedAt ───
DO $$
BEGIN
  BEGIN
    INSERT INTO items (id, slug, title, type, status, "shortDescription", description, "updatedAt", "noAdsPriceIdr")
    VALUES ('t3', 'uji-inv03', 'Uji INV-03', 'FREE', 'PUBLISHED', 'x', 'x', now(), 3000);
    RAISE EXCEPTION 'GAGAL: INV-03 lolos';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'OK  INV-03 PUBLISHED tanpa publishedAt ditolak';
  END;
END $$;

-- ─── INV-04 / INV-11: total = subtotal + fee, tidak negatif ───
DO $$
BEGIN
  BEGIN
    INSERT INTO orders (id, "orderNo", "subtotalIdr", "serviceFeeIdr", "totalIdr", "expiresAt", "updatedAt")
    VALUES ('o1', 'RT-UJI-001', 100000, 21, 999999, now() + interval '1 day', now());
    RAISE EXCEPTION 'GAGAL: INV-04 lolos';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'OK  INV-04 total tidak cocok ditolak';
  END;

  BEGIN
    INSERT INTO orders (id, "orderNo", "subtotalIdr", "serviceFeeIdr", "totalIdr", "expiresAt", "updatedAt")
    VALUES ('o2', 'RT-UJI-002', -1, 21, 20, now() + interval '1 day', now());
    RAISE EXCEPTION 'GAGAL: INV-11 lolos';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'OK  INV-11 nominal negatif ditolak';
  END;
END $$;

-- ─── INV-06: satu entitlement aktif, tapi boleh grant ulang setelah revoke ───
INSERT INTO users (id, email, "updatedAt") VALUES ('u1', 'uji@example.invalid', now());
INSERT INTO items (id, slug, title, type, "shortDescription", description, "updatedAt", "noAdsPriceIdr", "publishedAt", status)
VALUES ('t6', 'uji-inv06', 'Uji INV-06', 'FREE', 'x', 'x', now(), 3000, now(), 'PUBLISHED');

DO $$
BEGIN
  INSERT INTO entitlements (id, "userId", "itemId") VALUES ('e1', 'u1', 't6');

  BEGIN
    INSERT INTO entitlements (id, "userId", "itemId") VALUES ('e2', 'u1', 't6');
    RAISE EXCEPTION 'GAGAL: INV-06 mengizinkan dua entitlement aktif';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'OK  INV-06 entitlement aktif ganda ditolak';
  END;

  UPDATE entitlements SET "revokedAt" = now() WHERE id = 'e1';
  INSERT INTO entitlements (id, "userId", "itemId") VALUES ('e3', 'u1', 't6');
  RAISE NOTICE 'OK  INV-06 grant ulang setelah revoke diterima';
END $$;

-- ─── INV-07: uses <= maxUses ───
DO $$
BEGIN
  BEGIN
    INSERT INTO download_tokens (id, "tokenHash", "itemId", purpose, "expiresAt", "maxUses", uses)
    VALUES ('d1', 'hash-uji', 't6', 'FREE_AD', now() + interval '1 hour', 1, 2);
    RAISE EXCEPTION 'GAGAL: INV-07 lolos';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'OK  INV-07 uses > maxUses ditolak';
  END;
END $$;

-- ─── Pencarian: ekstensi, indeks, dan kueri ───
SELECT extname AS ekstensi FROM pg_extension WHERE extname = 'pg_trgm';

SELECT indexname
FROM pg_indexes
WHERE indexname IN ('items_search_tsv_idx', 'items_title_trgm_idx', 'entitlements_active_unique')
ORDER BY indexname;

SELECT count(*) AS hasil_fts_kasir
FROM items
WHERE status = 'PUBLISHED'
  AND to_tsvector('indonesian'::regconfig, title || ' ' || "shortDescription")
      @@ websearch_to_tsquery('indonesian'::regconfig, 'kasir');

SELECT round(similarity('kasir toko', 'kasir')::numeric, 3) AS skor_trigram;

-- Ambang pencarian aplikasi (`03-data-model.md` §4): typo ringan lolos,
-- kata sampah tidak. Gagal = ambang atau fungsi SQL di aplikasi berubah.
DO $$
BEGIN
  IF word_similarity('kasirr', 'Aplikasi POS Kasir Laravel') <= 0.5 THEN
    RAISE EXCEPTION 'FR-CAT-14: word_similarity("kasirr") harus > 0.5';
  END IF;

  IF word_similarity('zzz', 'Aplikasi POS Kasir Laravel') > 0.5 THEN
    RAISE EXCEPTION 'FR-CAT-14: "zzz" tidak boleh dianggap cocok';
  END IF;

  RAISE NOTICE 'OK  FR-CAT-14 word_similarity 0.5: typo cocok, kata sampah tidak';
END $$;

ROLLBACK;
