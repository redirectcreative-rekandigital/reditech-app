import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Loader2, type LucideIcon } from "lucide-react";
import { Slot } from "radix-ui";

/**
 * Button produk (L2) — `11-component-inventory.md` 11.1.
 * Varian mengikuti `10-design-tokens.md` 9.1, bukan nama bawaan shadcn.
 * Hover memakai opasitas token (`/90`), bukan token turunan baru.
 */
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors focus-visible:focus-ring disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        outline:
          "border border-border-strong bg-transparent text-foreground hover:bg-muted",
        ghost: "bg-transparent text-foreground hover:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        destructiveOutline:
          "border border-destructive bg-transparent text-foreground hover:bg-destructive/10",
      },
      size: {
        sm: "h-8 px-3 has-[>svg]:px-2.5",
        md: "h-10 px-4 has-[>svg]:px-3",
        lg: "h-12 px-5 text-base has-[>svg]:px-4",
        icon: "size-10",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
    iconLeft?: LucideIcon;
    iconRight?: LucideIcon;
  };

export function Button({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  loading = false,
  iconLeft: IconLeft,
  iconRight: IconRight,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, fullWidth }), className);

  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant ?? "primary"}
        data-size={size ?? "md"}
        className={classes}
        {...props}
      >
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      data-slot="button"
      data-variant={variant ?? "primary"}
      data-size={size ?? "md"}
      className={classes}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        IconLeft && <IconLeft aria-hidden="true" />
      )}
      {children}
      {IconRight && !loading && <IconRight aria-hidden="true" />}
    </button>
  );
}

export type IconButtonProps = Omit<ButtonProps, "children" | "iconLeft" | "iconRight"> & {
  icon: LucideIcon;
  /** Wajib: tombol ikon tanpa label gagal WCAG 4.1.2. */
  label: string;
};

export function IconButton({ icon: Icon, label, size = "icon", ...props }: IconButtonProps) {
  return (
    <Button size={size} aria-label={label} title={label} {...props}>
      <Icon aria-hidden="true" />
    </Button>
  );
}
