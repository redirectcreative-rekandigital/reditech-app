/**
 * Kartu Open Graph bersama. `ImageResponse` tidak memakai Tailwind, jadi
 * semua gaya ditulis inline dan hanya memakai token Celestial
 * (`design.md`): putih, hitam, aqua #58d3db, abu #323232.
 */
export const ogSize = { width: 1200, height: 630 } as const;

export function OgCard({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#ffffff",
        borderLeft: "16px solid #58d3db",
        padding: "72px 80px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 28, height: 28, background: "#58d3db", borderRadius: 6 }} />
        <div style={{ fontSize: 30, fontWeight: 600, color: "#000000", letterSpacing: -0.5 }}>
          Reditech
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: "#323232",
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontSize: 64,
            lineHeight: 1.1,
            fontWeight: 600,
            color: "#000000",
            letterSpacing: -1.5,
            maxWidth: 900,
          }}
        >
          {title.length > 88 ? `${title.slice(0, 87)}…` : title}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#323232" }}>
        <div>www.reditech.id</div>
        <div>Source code siap pakai</div>
      </div>
    </div>
  );
}
