import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** − [n] + stepper; typing is committed on blur or Enter and clamped to 1…max. */
export function QuantityStepper({
  value,
  max,
  onChange,
  label,
  size = "md",
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
  size?: "sm" | "md";
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const n = Number.parseInt(draft, 10);
    const next = Number.isFinite(n) ? Math.max(1, Math.min(max, n)) : value;
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  const btn = cn(
    "grid place-items-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
    size === "sm" ? "h-8 w-8" : "h-10 w-10",
  );

  return (
    <div
      className="inline-flex items-center rounded-md border bg-card"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label={`Decrease ${label.toLowerCase()}`}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        value={draft}
        inputMode="numeric"
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        aria-label={label}
        className={cn(
          "border-x bg-transparent text-center text-sm tabular-nums outline-none focus-visible:bg-accent/40",
          size === "sm" ? "h-8 w-10" : "h-10 w-12",
        )}
      />
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
