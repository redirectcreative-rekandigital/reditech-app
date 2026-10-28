"use client";

import { Link2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui-ext/button";

/** `ShareButtons` — FR-ITEM-05. WhatsApp membuka tab baru tanpa referrer. */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link disalin");
    } catch {
      toast.error("Gagal menyalin", { description: "Salin alamat dari bilah browser." });
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <a href={whatsapp} target="_blank" rel="noopener noreferrer">
          Bagikan
        </a>
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={copy} iconLeft={Link2}>
        Salin link
      </Button>
    </div>
  );
}
