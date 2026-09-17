import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-[background-color] duration-150 ease-out",
        checked ? "bg-signal" : "bg-raised shadow-hairline",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-6 rounded-full bg-ink transition-transform duration-150 ease-out",
          checked ? "translate-x-5 bg-signal-fg" : "translate-x-0",
        )}
      />
    </button>
  );
}
