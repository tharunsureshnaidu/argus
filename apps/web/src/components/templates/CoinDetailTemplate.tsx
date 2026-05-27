"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Text } from "@/components/atoms/Text";
import { ChartPanel } from "@/components/organisms/ChartPanel";
import { CoinHeaderStats } from "@/components/organisms/CoinHeaderStats";
import { IndicatorsPlaceholder } from "@/components/organisms/IndicatorsPlaceholder";
import { NewsList } from "@/components/organisms/NewsList";
import { useCoin } from "@/hooks/useCoins";
import { PageShell } from "./PageShell";

export function CoinDetailTemplate({ symbol }: { symbol: string }) {
  const upper = symbol.toUpperCase();
  const { coin, status } = useCoin(upper);

  return (
    <PageShell>
      <div className="mb-4 flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="sm">
            ← All coins
          </Button>
        </Link>
      </div>

      {status === "error" && !coin ? (
        <Card className="p-6 text-center">
          <Text variant="subtitle">Coin not tracked</Text>
          <Text variant="caption" tone="secondary" className="mt-1 block">
            {upper} isn&apos;t in the tracked list. Add it to the backend&apos;s
            <code className="mx-1 rounded bg-overlay px-1 font-mono">
              src/coins/sources.rs
            </code>
            and restart.
          </Text>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-6"
        >
          <CoinHeaderStats coin={coin} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
            <ChartPanel symbol={upper} />
            <div className="flex flex-col gap-6">
              <IndicatorsPlaceholder />
              <NewsList coin={upper} title="News" limit={10} />
            </div>
          </div>
        </motion.div>
      )}
    </PageShell>
  );
}
