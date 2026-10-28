/** Hanya path internal yang boleh menjadi tujuan setelah masuk. */
export function safeRedirect(value: string | null | undefined, fallback = "/admin"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
