import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium select-none touch-manipulation active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 transition-[transform,background-color,color,box-shadow] duration-150 ease-out",
  {
    variants: {
      variant: {
        primary: "bg-ink text-canvas hover:bg-ink/90 shadow-hairline",
        ghost: "bg-transparent text-quiet hover:text-ink hover:bg-raised",
        outline: "bg-transparent text-ink shadow-hairline hover:bg-raised",
        signal: "bg-signal text-signal-fg hover:bg-signal/90",
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-md",
        md: "h-11 px-4 text-sm rounded-lg",
        icon: "size-11 rounded-lg",
        pill: "h-9 px-3 text-xs rounded-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
