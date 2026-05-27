import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "positive" | "negative" | "accent";

const toneClass: Record<Tone, string> = {
  neutral:
    "bg-overlay text-text-secondary border border-border-subtle",
  positive: "bg-positive-soft text-positive",
  negative: "bg-negative-soft text-negative",
  accent: "bg-accent-soft text-accent",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
