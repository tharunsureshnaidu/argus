"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  HistogramSeries,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

import { Card } from "@/components/atoms/Card";
import { Skeleton } from "@/components/atoms/Skeleton";
import { Text } from "@/components/atoms/Text";
import { ChangeBadge } from "@/components/molecules/ChangeBadge";
import { SegmentedControl } from "@/components/molecules/SegmentedControl";
import { NewsDrawer } from "@/components/organisms/NewsDrawer";
import { useCandles } from "@/hooks/useCandles";
import { useCoin } from "@/hooks/useCoins";
import { useNews } from "@/hooks/useNews";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { isoToEpochSeconds, timeAgo } from "@/lib/formatters/time";
import { formatPrice } from "@/lib/formatters/price";
import { htmlToText } from "@/lib/formatters/html";
import { cn } from "@/lib/cn";
import {
  SUPPORTED_INTERVALS,
  type Interval,
} from "@/features/candles/candlesTypes";
import type { Article } from "@/features/news/newsTypes";

interface OhlcLegend {
  open: number;
  high: number;
  low: number;
  close: number;
}

/** A news marker anchored to a candle: representative article + bar context. */
interface ChartMarker {
  time: number;
  price: number;
  /** Bar closed up — drives arrow direction + color. */
  up: boolean;
  article: Article;
  count: number;
}

/**
 * TradingView Lightweight Charts wrapped behind a React lifecycle.
 *
 * News markers are the differentiator: instead of the library's flat dots we
 * overlay our own animated arrows (positioned via the chart's coordinate API),
 * each with a hover preview. Clicking one opens the full story in a side
 * drawer / bottom sheet so the price stays visible while you read.
 */
export function ChartPanel({ symbol }: { symbol: string }) {
  const [interval, setInterval] = useState<Interval>("1h");

  const { candles, status: candlesStatus } = useCandles({ symbol, interval });
  const { articles } = useNews({ coin: symbol, limit: 200 });
  const { coin } = useCoin(symbol);
  const { theme } = useTheme();

  const [legend, setLegend] = useState<OhlcLegend | null>(null);
  const [coords, setCoords] = useState<({ x: number; y: number } | null)[]>([]);
  const [selected, setSelected] = useState<Article | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const lastPrice =
    candles.length > 0 ? candles[candles.length - 1]!.close : null;

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

    // Live OHLC legend: read the hovered bar off the crosshair param.
    chart.subscribeCrosshairMove((param) => {
      const data = param.seriesData.get(candleSeries) as
        | CandlestickData
        | undefined;
      setLegend(
        data
          ? {
              open: data.open,
              high: data.high,
              low: data.low,
              close: data.close,
            }
          : null,
      );
    });

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
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
  // News markers — group articles by the candle bucket that contains them
  // (one marker per bar; later stories collapse into a "+N more" count).
  // -------------------------------------------------------------------------
  const chartMarkers = useMemo<ChartMarker[]>(() => {
    if (candles.length === 0) return [];

    const candleTimes = candles.map((c) => isoToEpochSeconds(c.ts));
    const firstTs = candleTimes[0]!;
    const lastTs = candleTimes[candleTimes.length - 1]!;
    const barByTime = new Map(
      candles.map((c) => {
        const t = isoToEpochSeconds(c.ts);
        return [t, { high: c.high, up: c.close >= c.open }] as const;
      }),
    );

    const snapToBar = (t: number): number => {
      let lo = 0;
      let hi = candleTimes.length - 1;
      let ans = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (candleTimes[mid]! <= t) {
          ans = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      return candleTimes[ans]!;
    };

    const groups = new Map<number, Article[]>();
    for (const a of articles) {
      if (!a.published) continue;
      const t = isoToEpochSeconds(a.published);
      if (t < firstTs || t > lastTs) continue;
      const bar = snapToBar(t);
      const list = groups.get(bar);
      if (list) list.push(a);
      else groups.set(bar, [a]);
    }

    const markers: ChartMarker[] = [];
    for (const [time, arts] of groups) {
      const bar = barByTime.get(time);
      if (!bar) continue;
      const rep = arts.reduce((latest, a) =>
        isoToEpochSeconds(a.published!) > isoToEpochSeconds(latest.published!)
          ? a
          : latest,
      );
      markers.push({
        time,
        price: bar.high,
        up: bar.up,
        article: rep,
        count: arts.length,
      });
    }
    return markers.sort((a, b) => a.time - b.time);
  }, [articles, candles]);

  // -------------------------------------------------------------------------
  // Project each marker's (time, price) to pixel coordinates, and keep them in
  // sync as the user pans/zooms/resizes.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const chart = chartRef.current;
    const cs = candleSeriesRef.current;
    if (!chart || !cs) return;

    const ts = chart.timeScale();
    let raf = 0;

    const compute = () => {
      raf = 0;
      // Width of the candle plot area = container minus the right price axis.
      // Markers whose x lands in (or past) the axis are hidden so they never
      // cover the price labels while panning.
      const axisWidth = chart.priceScale("right").width();
      const plotWidth = (containerRef.current?.clientWidth ?? 0) - axisWidth;
      setCoords(
        chartMarkers.map((m) => {
          const x = ts.timeToCoordinate(m.time as UTCTimestamp);
          const y = cs.priceToCoordinate(m.price);
          if (x == null || y == null) return null;
          // Leave a half-badge margin so it can't even partially spill over.
          if (x < 0 || x > plotWidth - 10) return null;
          return { x, y };
        }),
      );
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };

    ts.subscribeVisibleLogicalRangeChange(schedule);
    const ro = new ResizeObserver(schedule);
    if (containerRef.current) ro.observe(containerRef.current);
    schedule();

    return () => {
      ts.unsubscribeVisibleLogicalRangeChange(schedule);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [chartMarkers]);

  // -------------------------------------------------------------------------
  // Theme swap — re-read the CSS vars now that they point at new values.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const chart = chartRef.current;
    const cs = candleSeriesRef.current;
    if (!chart || !cs) return;

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

  const intervalOptions = useMemo(
    () => SUPPORTED_INTERVALS.map((i) => ({ value: i, label: i })),
    [],
  );

  return (
    <Card
      variant="raised"
      className="flex h-120 flex-col overflow-hidden md:h-140 xl:h-170"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle p-4">
        <div>
          <Text variant="label" tone="tertiary">
            {symbol} · Price
          </Text>
          <div className="mt-0.5 flex items-center gap-2">
            <Text variant="subtitle" numeric className="text-xl">
              {formatPrice(lastPrice)}
            </Text>
            <ChangeBadge value={coin?.change_24h_pct} size="sm" />
          </div>
        </div>
        <SegmentedControl
          size="sm"
          options={intervalOptions}
          value={interval}
          onChange={setInterval}
        />
      </div>

      <div className="relative min-h-0 w-full flex-1">
        <div ref={containerRef} className="absolute inset-0" />

        {/* News marker overlay. Sits above the chart canvas so the markers
            are hoverable/clickable; the layer itself is click-through. */}
        <div className="pointer-events-none absolute inset-0 z-10">
          {chartMarkers.map((m, i) => {
            const pos = coords[i];
            if (!pos) return null;
            return (
              <ChartNewsMarker
                key={`${m.time}-${m.article.link}`}
                x={pos.x}
                y={pos.y}
                marker={m}
                onOpen={() => setSelected(m.article)}
              />
            );
          })}
        </div>

        {/* Live OHLC legend / hint (top-left overlay). */}
        {legend ? (
          <div className="pointer-events-none absolute left-3 top-3 flex gap-3 rounded-lg border border-border-subtle bg-surface/80 px-3 py-1.5 text-xs backdrop-blur">
            <OhlcField label="O" value={legend.open} />
            <OhlcField label="H" value={legend.high} />
            <OhlcField label="L" value={legend.low} />
            <OhlcField label="C" value={legend.close} />
          </div>
        ) : (
          <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-border-subtle bg-surface/80 px-3 py-1.5 text-xs text-text-tertiary backdrop-blur">
            {chartMarkers.length > 0
              ? `${chartMarkers.length} news marker${chartMarkers.length === 1 ? "" : "s"} · hover to preview`
              : "Hover for OHLC"}
          </div>
        )}

        {candlesStatus === "loading" && candles.length === 0 ? (
          <div className="absolute inset-0 p-2">
            <Skeleton className="h-full w-full" />
          </div>
        ) : null}

        {candlesStatus === "error" && candles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Text variant="caption" tone="tertiary">
              No candle data available for {symbol}.
            </Text>
          </div>
        ) : null}
      </div>

      <NewsDrawer article={selected} onClose={() => setSelected(null)} />
    </Card>
  );
}

/**
 * A single animated news marker + hover preview. The whole thing is one button
 * so hovering reveals the tooltip and a click (or tap on mobile) opens the
 * reader. Direction/colour follow the underlying bar.
 */
function ChartNewsMarker({
  x,
  y,
  marker,
  onOpen,
}: {
  x: number;
  y: number;
  marker: ChartMarker;
  onOpen: () => void;
}) {
  const { up, count, article } = marker;
  const title = htmlToText(article.title) || article.title;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`News: ${title}`}
      style={{ left: x, top: y - 8 }}
      className="group pointer-events-auto absolute -translate-x-1/2 -translate-y-full focus-visible:outline-none"
    >
      {/* Tooltip preview */}
      <span
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 mb-2 w-56 -translate-x-1/2",
          "translate-y-1 rounded-lg border border-border-default bg-surface p-3 text-left shadow-lg",
          "opacity-0 transition duration-150 group-hover:translate-y-0 group-hover:opacity-100",
          "group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
        )}
      >
        <span className="flex items-center justify-between gap-2 text-[11px] text-text-tertiary">
          <span className="truncate font-medium uppercase tracking-wider">
            {article.source}
          </span>
          <span className="shrink-0">{timeAgo(article.published)}</span>
        </span>
        <span className="mt-1 line-clamp-2 block text-xs font-medium text-text-primary">
          {title}
        </span>
        {count > 1 ? (
          <span className="mt-1 block text-[11px] text-text-tertiary">
            +{count - 1} more {count - 1 === 1 ? "story" : "stories"} here
          </span>
        ) : null}
        <span className="mt-2 block text-[11px] font-medium text-accent">
          Click to read →
        </span>
      </span>

      {/* The animated arrow badge */}
      <span
        className={cn(
          "relative grid h-5 w-5 animate-[bob_1.8s_ease-in-out_infinite] place-items-center rounded-full border shadow-sm",
          "transition-transform duration-150 group-hover:scale-110",
          up
            ? "border-positive/40 bg-positive/15 text-positive"
            : "border-negative/40 bg-negative/15 text-negative",
        )}
      >
        <Chevron up={up} />
        {count > 1 ? (
          <span className="absolute -right-1.5 -top-1.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-accent px-0.5 text-[9px] font-semibold text-text-inverse">
            {count}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function Chevron({ up }: { up: boolean }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {up ? <path d="m6 14 6-6 6 6" /> : <path d="m6 10 6 6 6-6" />}
    </svg>
  );
}

function OhlcField({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-text-tertiary">{label}</span>
      <span className="num font-medium text-text-primary">
        {formatPrice(value)}
      </span>
    </span>
  );
}

/** Resolve a CSS variable's *current* value from the document root. */
function readVar(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}
