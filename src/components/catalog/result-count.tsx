/**
 * `ResultCount` — FR-CAT-02.
 * Angka selalu di `<strong>`; saat kosong tidak ada rentang "0–0".
 */
export function ResultCount({
  from,
  to,
  total,
  query,
}: {
  from: number;
  to: number;
  total: number;
  query: string | null;
}) {
  return (
    <p aria-live="polite" className="text-sm text-muted-foreground">
      {total === 0 ? (
        <>
          Tidak ada source code yang cocok
          {query ? (
            <>
              {" "}
              untuk <strong className="font-semibold text-foreground">“{query}”</strong>
            </>
          ) : null}
          .
        </>
      ) : (
        <>
          Menampilkan <strong className="font-semibold text-foreground">{from}</strong>–
          <strong className="font-semibold text-foreground">{to}</strong> dari{" "}
          <strong className="font-semibold text-foreground">{total}</strong> source code
          {query ? (
            <>
              {" "}
              untuk <strong className="font-semibold text-foreground">“{query}”</strong>
            </>
          ) : null}
        </>
      )}
    </p>
  );
}
