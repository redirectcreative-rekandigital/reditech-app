"use client";

/**
 * `global-error.tsx` menggantikan root layout, jadi harus memuat <html> dan <body>.
 * Karena itu ia tidak boleh bergantung pada token CSS atau komponen klien lain.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#ffffff",
          color: "#000000",
          fontFamily: "system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <main style={{ maxWidth: "42ch" }}>
          <p style={{ margin: 0, fontSize: 14, color: "#323232" }}>500</p>
          <h1 style={{ margin: "8px 0 0", fontSize: 28, lineHeight: 1.15 }}>
            Aplikasi gagal dimuat
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: 16, lineHeight: 1.6, color: "#323232" }}>
            Kesalahan terjadi sebelum antarmuka sempat dirender. Muat ulang halaman ini.
          </p>
          {error.digest ? (
            <p style={{ margin: "16px 0 0", fontFamily: "Menlo, monospace", fontSize: 13 }}>
              Kode kejadian: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              height: 40,
              padding: "0 16px",
              border: 0,
              borderRadius: 6,
              background: "#58d3db",
              color: "#000000",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Muat ulang
          </button>
        </main>
      </body>
    </html>
  );
}
