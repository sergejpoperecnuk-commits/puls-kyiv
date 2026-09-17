import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg bg-raised px-3.5 text-base text-ink outline-none",
        "shadow-hairline placeholder:text-dim",
        "transition-[box-shadow,background-color] duration-150 ease-out",
        "focus:shadow-focus",
        className,
      )}
      {...props}
    />
  );
}
