import type { ReactNode } from "react";

import { Header } from "@/components/organisms/Header";

/**
 * App-level frame: sticky header + a constrained content well. Every page
 * renders inside this so spacing, max-width, and the header stay consistent.
 */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
        {children}
      </main>
    </div>
  );
}
