"use client";

import { motion } from "framer-motion";

import { Text } from "@/components/atoms/Text";
import { formatPrice } from "@/lib/formatters/price";

/**
 * Big animated price readout for the coin detail header. The motion key on
 * the price string means a brand-new instance mounts whenever the value
 * changes, which triggers the soft fade-in.
 */
export function PriceTicker({
  price,
  size = "xl",
}: {
  price: number | null | undefined;
  size?: "lg" | "xl";
}) {
  const sizeClass = size === "xl" ? "text-4xl md:text-5xl" : "text-2xl";

  return (
    <motion.div
      key={price}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className={`${sizeClass} font-semibold tracking-tight num`}
    >
      <Text as="span" variant="display" className={sizeClass}>
        {formatPrice(price)}
      </Text>
    </motion.div>
  );
}
