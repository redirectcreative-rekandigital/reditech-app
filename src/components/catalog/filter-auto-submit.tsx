"use client";

import { useEffect } from "react";

/**
 * Navigasi otomatis saat radio atau select berubah.
 *
 * Formnya tetap form GET biasa: tanpa JavaScript pengguna menekan tombol
 * `Terapkan filter`, jadi katalog tidak bergantung pada klien.
 */
export function FilterAutoSubmit({ formId }: { formId: string }) {
  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;

    const onChange = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.matches('input[type="radio"], select')) {
        form.requestSubmit();
      }
    };

    form.addEventListener("change", onChange);
    return () => form.removeEventListener("change", onChange);
  }, [formId]);

  return null;
}
