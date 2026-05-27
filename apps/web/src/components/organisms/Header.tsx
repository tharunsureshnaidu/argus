"use client";

import { Logo } from "@/components/atoms/Logo";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { Text } from "@/components/atoms/Text";

/**
 * Top app bar. Intentionally minimal — no nav items yet because there are
 * only two pages (home + coin detail), and the logo doubles as "go home."
 */
export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
        <Logo />
        <div className="flex items-center gap-3">
          <Text variant="caption" tone="tertiary" className="hidden md:inline">
            A thinking tool, not a prediction tool.
          </Text>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
