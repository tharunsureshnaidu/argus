"use client";

import { motion } from "framer-motion";

import { Text } from "@/components/atoms/Text";
import { CoinGrid } from "@/components/organisms/CoinGrid";
import { NewsList } from "@/components/organisms/NewsList";
import { TopMovers } from "@/components/organisms/TopMovers";
import { PageShell } from "./PageShell";

/**
 * Home: a coin grid, top movers below it, and the latest news on the side
 * on wide screens.
 */
export function HomeTemplate() {
  return (
    <PageShell>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-2"
      >
        <Text variant="display">Markets</Text>
        <Text variant="body" tone="secondary" className="max-w-2xl">
          Read the signals — prices, indicators, news, sentiment — and decide
          for yourself. A thinking tool, not a prediction tool.
        </Text>
      </motion.div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <CoinGrid />
          <TopMovers />
        </div>

        <aside className="hidden lg:block">
          <NewsList title="Latest news" limit={8} />
        </aside>
      </div>

      <div className="mt-10 lg:hidden">
        <NewsList title="Latest news" limit={6} />
      </div>
    </PageShell>
  );
}
