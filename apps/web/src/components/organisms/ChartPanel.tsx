"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  HistogramSeries,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";

import { Card } from "@/components/atoms/Card";
import { Skeleton } from "@/components/atoms/Skeleton";
import { Text } from "@/components/atoms/Text";
import { IntervalSwitcher } from "@/components/molecules/IntervalSwitcher";
import { useCandles } from "@/hooks/useCandles";
import { useNews } from "@/hooks/useNews";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { isoToEpochSeconds } from "@/lib/formatters/time";
import { SUPPORTED_INTERVALS, type Interval } from "@/features/candles/candlesTypes";

/**
 * TradingView Lightweight Charts wrapped behind a React lifecycle.
 *
 * Strategy:
 *   - Chart instance is created once on mount and disposed on unmount.
 *   - Candles + news refresh via separate effects that just call `setData`
 *     / `setMarkers` on the existing series. No re-creation, no flicker.
 *   - Theme changes update the chart's color options in place.
 */
export function ChartPanel({ symbol }: { symbol: string }) {
  const [interval, setInterval] = useState<Interval>("1h");

  const { candles, status: candlesStatus } = useCandles({ symbol, interval });
  const { articles } = useNews({ coin: symbol, limit: 50 });
  const { theme } = useTheme();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

  // -------------------------------------------------------------------------
  // Lifecycle: create the chart once.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: readVar("--text-secondary"),
        fontFamily: "var(--font-sans)",
      },
      grid: {
        vertLines: { color: readVar("--border-subtle") },
        horzLines: { color: readVar("--border-subtle") },
      },
      rightPriceScale: { borderColor: readVar("--border-subtle") },
      timeScale: {
        borderColor: readVar("--border-subtle"),
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: { mode: 1 },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: readVar("--positive"),
      downColor: readVar("--negative"),
      borderUpColor: readVar("--positive"),
      borderDownColor: readVar("--negative"),
      wickUpColor: readVar("--positive"),
      wickDownColor: readVar("--negative"),
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      color: readVar("--border-default"),
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    // Markers plugin in lightweight-charts v5+ is its own thing, attached to
    // the series rather than living on it directly.
    markersRef.current = createSeriesMarkers(candleSeries, []);

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Push candles whenever they change.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const cs = candleSeriesRef.current;
    const vs = volumeSeriesRef.current;
    if (!cs || !vs || candles.length === 0) return;

    cs.setData(
      candles.map((c) => ({
        time: isoToEpochSeconds(c.ts) as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );

    const upColor = readVar("--positive-soft");
    const downColor = readVar("--negative-soft");
    vs.setData(
      candles.map((c) => ({
        time: isoToEpochSeconds(c.ts) as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? upColor : downColor,
      })),
    );

    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  // -------------------------------------------------------------------------
  // News markers — Sextant's whole differentiator.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const cs = candleSeriesRef.current;
    const mk = markersRef.current;
    if (!cs || !mk || candles.length === 0) return;

    const firstTs = isoToEpochSeconds(candles[0]!.ts);
    const lastTs = isoToEpochSeconds(candles[candles.length - 1]!.ts);

    const markers: SeriesMarker<Time>[] = articles
      .filter((a) => a.published)
      .map((a) => ({
        time: isoToEpochSeconds(a.published!) as UTCTimestamp,
        position: "aboveBar" as const,
        color: readVar("--accent"),
        shape: "circle" as const,
        text: a.title.length > 40 ? `${a.title.slice(0, 40)}…` : a.title,
      }))
      .filter((m) => {
        const t = m.time as number;
        return t >= firstTs && t <= lastTs;
      });

    mk.setMarkers(markers);
  }, [articles, candles]);

  // -------------------------------------------------------------------------
  // Theme swap — re-read the CSS vars now that they point at new values.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const chart = chartRef.current;
    const cs = candleSeriesRef.current;
    const vs = volumeSeriesRef.current;
    if (!chart || !cs || !vs) return;

    chart.applyOptions({
      layout: {
        background: { color: "transparent" },
        textColor: readVar("--text-secondary"),
      },
      grid: {
        vertLines: { color: readVar("--border-subtle") },
        horzLines: { color: readVar("--border-subtle") },
      },
      rightPriceScale: { borderColor: readVar("--border-subtle") },
      timeScale: { borderColor: readVar("--border-subtle") },
    });
    cs.applyOptions({
      upColor: readVar("--positive"),
      downColor: readVar("--negative"),
      borderUpColor: readVar("--positive"),
      borderDownColor: readVar("--negative"),
      wickUpColor: readVar("--positive"),
      wickDownColor: readVar("--negative"),
    });
  }, [theme]);

  const intervals = useMemo(() => SUPPORTED_INTERVALS, []);

  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle p-4">
        <div>
          <Text variant="subtitle">Price</Text>
          <Text variant="caption" tone="tertiary">
            {articles.length > 0
              ? `${articles.length} news markers in view`
              : "Hover for OHLC"}
          </Text>
        </div>
        <IntervalSwitcher
          options={intervals}
          value={interval}
          onChange={setInterval}
        />
      </div>

      <div className="relative h-[480px] w-full">
        <div ref={containerRef} className="absolute inset-0" />
        {candlesStatus === "loading" && candles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : null}
      </div>
    </Card>
  );
}

/** Resolve a CSS variable's *current* value from the document root. */
function readVar(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
