"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Skeleton } from "@/components/atoms/Skeleton";
import { Text } from "@/components/atoms/Text";
import { ChangeBadge } from "@/components/molecules/ChangeBadge";
import { useCoinList } from "@/hooks/useCoins";
import { formatPercent } from "@/lib/formatters/percent";

/**
 * Horizontally-scrollable ticker of biggest 24h gainers + losers. Pure
 * visual flourish at the bottom of the home page — no critical info that
 * isn't also in the main grid.
 */
export function TopMovers() {
  const { coins, status } = useCoinList();

  const movers = useMemo(() => {
    const ranked = coins
      .filter((c) => c.change_24h_pct != null)
      .sort(
        (a, b) =>
          Math.abs(b.change_24h_pct ?? 0) - Math.abs(a.change_24h_pct ?? 0),
      )
      .slice(0, 12);
    return ranked;
  }, [coins]);

  if (status === "loading" && movers.length === 0) {
    return (
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-32 shrink-0" />
        ))}
      </div>
    );
  }

  if (movers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3">
      <Text
        variant="label"
        tone="tertiary"
        className="shrink-0 mr-1"
      >
        Top movers
      </Text>
      {movers.map((coin) => (
        <Link
          key={coin.symbol}
          href={`/coins/${coin.symbol}`}
          className="inline-flex shrink-0 items-center gap-2 rounded-md border border-border-subtle bg-surface px-3 py-1.5 transition-colors hover:bg-surface-raised hover:border-border-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Text variant="caption" className="font-semibold">
            {coin.symbol}
          </Text>
          <Text variant="caption" tone="tertiary" numeric>
            {formatPercent(coin.change_24h_pct)}
          </Text>
          <ChangeBadge value={coin.change_24h_pct} size="sm" />
        </Link>
      ))}
    </div>
  );
}
