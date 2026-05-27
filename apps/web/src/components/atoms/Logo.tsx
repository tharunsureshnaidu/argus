import Link from "next/link";
import { Text } from "./Text";

/** Brand mark in the header. Just text for now — easy to swap for an SVG. */
export function Logo() {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2"
      aria-label="Sextant home"
    >
      <span
        className="grid h-7 w-7 place-items-center rounded-md bg-accent text-text-inverse text-sm font-semibold transition-transform group-hover:scale-105"
        aria-hidden="true"
      >
        S
      </span>
      <Text variant="subtitle" className="tracking-tight">
        Sextant
      </Text>
    </Link>
  );
}
