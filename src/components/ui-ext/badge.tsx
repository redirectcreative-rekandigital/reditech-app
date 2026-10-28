import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

/**
 * Badge produk (L2) — `10-design-tokens.md` 9.2.
 * `success` dan `warning` berbagi latar; pembeda wajib ikon + kata.
 */
export const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 overflow-hidden rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      tone: {
        premium: "border-transparent bg-primary text-primary-foreground",
        free: "border-border-strong bg-transparent text-foreground",
        neutral: "border-transparent bg-muted text-muted-foreground",
        success: "border-transparent bg-accent text-accent-foreground",
        warning: "border-transparent bg-accent text-accent-foreground",
        danger: "border-transparent bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-tone={tone ?? "neutral"}
      className={cn(badgeVariants({ tone }), className)}
      {...props}
    />
  );
}
