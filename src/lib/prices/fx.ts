import { getCacheStore, TTL } from "@/lib/cache/store";
import { fetchWithTimeout } from "@/lib/http";
import type { PricePoint, PriceSeries } from "./types";

type FxSeries = { base: string; quote: string; points: PricePoint[]; source: string };

async function fetchYahooPair(base: string, quote: string): Promise<PricePoint[] | null> {
  const symbol = `${base}${quote}=X`;
  for (const host of ["query1.finance.yahoo.com", "query2.finance.yahoo.com"]) {
    try {
      const response = await fetchWithTimeout(
        `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1wk&range=max`,
        {
          headers: { "User-Agent": "Mozilla/5.0 AppleWebKit/537.36" },
          cache: "no-store",
        },
        20_000,
      );
      if (!response.ok) continue;
      const payload = await response.json() as {
        chart?: { result?: Array<{
          timestamp?: number[];
          indicators?: { quote?: Array<{ close?: Array<number | null> }> };
        }> };
      };
      const result = payload.chart?.result?.[0];
      const timestamps = result?.timestamp ?? [];
      const closes = result?.indicators?.quote?.[0]?.close ?? [];
      const points = timestamps.flatMap((timestamp, index): PricePoint[] => {
        const close = closes[index];
        return close !== null && close !== undefined && Number.isFinite(close) && close > 0
          ? [{ date: new Date(timestamp * 1000).toISOString().slice(0, 10), close }]
          : [];
      });
      if (points.length > 0) return points;
    } catch {
      // Se prueba el segundo host y, después, el par inverso.
    }
  }
  return null;
}

async function getDirectOrInverse(base: string, quote: string): Promise<FxSeries | null> {
  const direct = await fetchYahooPair(base, quote);
  if (direct) return { base, quote, points: direct, source: `Yahoo Finance ${base}/${quote}` };

  const inverse = await fetchYahooPair(quote, base);
  if (!inverse) return null;
  return {
    base,
    quote,
    points: inverse.map((point) => ({ date: point.date, close: 1 / point.close })),
    source: `Yahoo Finance ${quote}/${base} invertido`,
  };
}

function rateAtOrBefore(points: PricePoint[], date: string): number | null {
  let candidate: PricePoint | null = null;
  for (const point of points) {
    if (point.date > date) break;
    candidate = point;
  }
  if (!candidate) return null;
  const ageDays = (Date.parse(date) - Date.parse(candidate.date)) / 86_400_000;
  return ageDays <= 14 ? candidate.close : null;
}

async function getFxSeries(base: string, quote: string): Promise<FxSeries | null> {
  if (base === quote) return { base, quote, points: [], source: "misma divisa" };
  const cache = getCacheStore();
  const key = `prices:fx:v1:${base}:${quote}`;
  const cached = await cache.get<FxSeries>(key);
  if (cached?.points.length) return cached;

  let result = await getDirectOrInverse(base, quote);
  if (!result && base !== "USD" && quote !== "USD") {
    const [toUsd, fromUsd] = await Promise.all([
      getDirectOrInverse(base, "USD"),
      getDirectOrInverse("USD", quote),
    ]);
    if (toUsd && fromUsd) {
      const points = toUsd.points.flatMap((point): PricePoint[] => {
        const secondLeg = rateAtOrBefore(fromUsd.points, point.date);
        return secondLeg === null ? [] : [{ date: point.date, close: point.close * secondLeg }];
      });
      if (points.length > 0) {
        result = { base, quote, points, source: `Yahoo Finance ${base}/USD/${quote}` };
      }
    }
  }
  if (result) await cache.set(key, result, TTL.prices);
  return result;
}

/** Convierte la cotización a la divisa de los estados antes de calcular múltiplos. */
export async function convertPriceSeriesCurrency(
  series: PriceSeries,
  targetCurrency: string,
): Promise<PriceSeries | null> {
  const sourceCurrency = series.currency?.toUpperCase() ?? null;
  const target = targetCurrency.toUpperCase();
  if (!sourceCurrency) return null;
  if (sourceCurrency === target) return series;

  const fx = await getFxSeries(sourceCurrency, target);
  if (!fx) return null;
  const points = series.points.flatMap((point): PricePoint[] => {
    const rate = rateAtOrBefore(fx.points, point.date);
    return rate === null ? [] : [{ date: point.date, close: Number((point.close * rate).toFixed(6)) }];
  });
  if (points.length === 0) return null;

  return {
    ...series,
    currency: target,
    points,
    source: `${series.source} · conversión ${sourceCurrency}→${target} (${fx.source})`,
  };
}
