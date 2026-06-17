import Link from "next/link";
import { Torus } from "lucide-react";
import { Text } from "./Text";

/**
 * Brand mark in the header — a small "eye" glyph (Argus, the all-seeing) on an
 * accent tile, plus the wordmark. Links home; the glyph scales subtly on hover.
 */
export function Logo() {
  return (
    <Link
      href="/"
      className="group inline-flex shrink-0 items-center gap-2.5"
      aria-label="Argus home"
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-text-inverse shadow-glow transition-transform duration-200 group-hover:scale-105">
        <Torus className="h-4.5 w-4.5" aria-hidden />
      </span>
      <Text variant="subtitle" className="font-semibold tracking-tight">
        Argus
      </Text>
    </Link>
  );
}
