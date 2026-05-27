"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Card } from "@/components/atoms/Card";
import { Text } from "@/components/atoms/Text";
import { CoinIcon } from "./CoinIcon";
import { ChangeBadge } from "./ChangeBadge";
import { formatCompactCurrency } from "@/lib/formatters/price";
import type { Coin } from "@/features/coins/coinsTypes";

/** One clickable card on the home grid. */
export function CoinTile({ coin }: { coin: Coin }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <Link
        href={`/coins/${coin.symbol}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
      >
        <Card interactive className="p-4">
          <div className="flex items-center gap-3">
            <CoinIcon src={coin.icon_url} symbol={coin.symbol} />
            <div className="flex-1 min-w-0">
              <Text variant="subtitle" className="truncate">
                {coin.name}
              </Text>
              <Text variant="caption" tone="tertiary">
                {coin.symbol}
              </Text>
            </div>
            <ChangeBadge value={coin.change_24h_pct} />
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <Text variant="label" tone="tertiary">
                Market cap
              </Text>
              <Text variant="subtitle" numeric className="block">
                {formatCompactCurrency(coin.market_cap_usd)}
              </Text>
            </div>
            <Sparkline change={coin.change_24h_pct} />
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

/**
 * Tiny faux-sparkline. Real sparkline data isn't yet exposed by the API; this
 * gives the card visual weight in the meantime. Color follows 24h direction
 * so the card still communicates trend at a glance.
 */
function Sparkline({ change }: { change: number | null | undefined }) {
  const positive = (change ?? 0) >= 0;
  const stroke = positive ? "stroke-positive" : "stroke-negative";

  return (
    <svg
      width="80"
      height="28"
      viewBox="0 0 80 28"
      fill="none"
      aria-hidden="true"
      className={stroke}
    >
      <path
        d={
          positive
            ? "M0 22 L12 18 L24 20 L36 14 L48 16 L60 8 L72 10 L80 4"
            : "M0 6 L12 10 L24 8 L36 14 L48 12 L60 20 L72 18 L80 24"
        }
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
