"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

import { MediaImage } from "@/components/media/media-image";
import { IconButton } from "@/components/ui-ext/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { ItemScreenshot } from "@/lib/items";

/**
 * `ScreenshotGallery` + `Lightbox` — FR-ITEM-01.
 * Tanpa gambar, komponen tidak merender apa pun sehingga tata letak tetap rapi
 * untuk item yang belum punya screenshot.
 */
export function ScreenshotGallery({
  title,
  images,
}: {
  title: string;
  images: ItemScreenshot[];
}) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  if (images.length === 0) return null;

  const total = images.length;
  const current = images[Math.min(index, total - 1)];
  const go = (delta: number) => setIndex((value) => (value + delta + total) % total);

  return (
    <section aria-labelledby="galeri-judul" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="galeri-judul" className="text-lg font-semibold tracking-tight">
          Galeri
        </h2>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Screenshot {index + 1} dari {total}
        </p>
      </div>

      <div
        role="group"
        aria-label={`Galeri screenshot ${title}`}
        className="relative overflow-hidden rounded-lg border border-border bg-muted"
      >
        <div className="aspect-[16/10] w-full">
          <MediaImage
            src={current.url}
            alt={current.alt}
            width={current.width}
            height={current.height}
            sizes="(min-width: 1024px) 720px, 100vw"
            priority
          />
        </div>

        {total > 1 ? (
          <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 items-center justify-between">
            <IconButton
              icon={ChevronLeft}
              label="Screenshot sebelumnya"
              variant="secondary"
              size="sm"
              onClick={() => go(-1)}
              className="size-10 rounded-full"
            />
            <IconButton
              icon={ChevronRight}
              label="Screenshot berikutnya"
              variant="secondary"
              size="sm"
              onClick={() => go(1)}
              className="size-10 rounded-full"
            />
          </div>
        ) : null}

        <div className="absolute bottom-3 right-3">
          <IconButton
            icon={Maximize2}
            label="Perbesar screenshot"
            variant="secondary"
            size="sm"
            onClick={() => setOpen(true)}
            className="size-10 rounded-full"
          />
        </div>
      </div>

      {current.caption ? (
        <p className="text-sm text-muted-foreground">{current.caption}</p>
      ) : null}

      {total > 1 ? (
        <ul className="flex list-none gap-2 overflow-x-auto pb-1">
          {images.map((image, imageIndex) => (
            <li key={`${image.url}-${imageIndex}`}>
              <button
                type="button"
                onClick={() => setIndex(imageIndex)}
                aria-label={`Lihat screenshot ${imageIndex + 1}`}
                aria-current={imageIndex === index ? "true" : undefined}
                className="block h-16 w-24 overflow-hidden rounded-md border border-border-strong opacity-70 hover:opacity-100 focus-ring aria-[current=true]:border-primary aria-[current=true]:opacity-100"
              >
                <MediaImage
                  src={image.url}
                  alt=""
                  width={image.width}
                  height={image.height}
                  sizes="96px"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className="max-w-[min(96vw,72rem)] border-border bg-background p-3 sm:p-4"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") go(-1);
            if (event.key === "ArrowRight") go(1);
          }}
        >
          <DialogTitle className="sr-only">
            Screenshot {index + 1} dari {total}: {current.alt}
          </DialogTitle>

          <div className="overflow-hidden rounded-md bg-muted">
            <div className="aspect-[16/10] w-full">
              <MediaImage
                src={current.url}
                alt={current.alt}
                width={current.width}
                height={current.height}
                sizes="96vw"
              />
            </div>
          </div>

          {total > 1 ? (
            <div className="mt-3 flex items-center justify-between">
              <IconButton
                icon={ChevronLeft}
                label="Screenshot sebelumnya"
                variant="outline"
                onClick={() => go(-1)}
                className="size-11"
              />
              <p className="text-sm text-muted-foreground">
                {index + 1} / {total}
              </p>
              <IconButton
                icon={ChevronRight}
                label="Screenshot berikutnya"
                variant="outline"
                onClick={() => go(1)}
                className="size-11"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
