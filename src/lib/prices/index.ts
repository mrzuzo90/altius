import { getCacheStore, TTL } from "@/lib/cache/store";
import { parseAlphaVantage, type AlphaVantagePayload } from "./alpha-vantage";
import type { PricePoint, PriceResult, SplitEvent } from "./types";
import { fetchWithTimeout } from "@/lib/http";

export type { PricePoint, PriceSeries, PriceResult } from "./types";

/**
 * Consulta la serie histórica de precios de mercado mediante feed público.
 */
type MarketPricePayload = { points: PricePoint[]; currency: string | null; splits: SplitEvent[] };

function normalizeYahooCurrency(raw: string | undefined): { currency: string | null; multiplier: number } {
  if (!raw) return { currency: null, multiplier: 1 };
  // Yahoo entrega las acciones londinenses en peniques aunque la divisa sea GBP.
  if (raw === "GBp" || raw.toUpperCase() === "GBX") return { currency: "GBP", multiplier: 0.01 };
  return { currency: raw.toUpperCase(), multiplier: 1 };
}

export function stitchPriceSegments(segments: PricePoint[][]): PricePoint[] {
  let stitched: PricePoint[] = [];
  for (const segment of segments) {
    const ordered = [...segment].sort((a, b) => a.date.localeCompare(b.date));
    const firstDate = ordered[0]?.date;
    if (!firstDate) continue;
    // Cada segmento posterior es más denso. Se elimina el solapamiento del
    // anterior para no dibujar a la vez cierres mensuales, semanales y diarios.
    stitched = stitched.filter((point) => point.date < firstDate);
    stitched.push(...ordered);
  }
  return [...new Map(stitched.map((point) => [point.date, point])).values()]
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchYahooSegment(
  symbol: string,
  interval: "1d" | "1wk" | "1mo",
  range: "1y" | "10y" | "max",
): Promise<MarketPricePayload | null> {
  for (const host of ["query1.finance.yahoo.com", "query2.finance.yahoo.com"]) try {
    const url = `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&events=splits`;
    const res = await fetchWithTimeout(url, {
      headers: { "User-Agent": "Mozilla/5.0 AppleWebKit/537.36" },
      cache: "no-store",
    }, 20_000);
    if (!res.ok) continue;

    const json = (await res.json()) as {
      chart?: {
        result?: [
          {
            timestamp?: number[];
            meta?: { currency?: string };
            events?: {
              splits?: Record<string, { date?: number; numerator?: number; denominator?: number }>;
            };
            indicators?: {
              adjclose?: [{ adjclose?: (number | null)[] }];
              quote?: [{ close?: (number | null)[] }];
            };
          },
        ];
      };
    };

    const result = json.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? result?.indicators?.adjclose?.[0]?.adjclose ?? [];
    const splits = Object.values(result?.events?.splits ?? {}).flatMap((split): SplitEvent[] =>
      split.date && split.numerator && split.denominator
        ? [{ date: new Date(split.date * 1000).toISOString().slice(0, 10), numerator: split.numerator, denominator: split.denominator }]
        : [],
    ).sort((a, b) => a.date.localeCompare(b.date));
    const quoteCurrency = normalizeYahooCurrency(result?.meta?.currency);

    const points: PricePoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const c = closes[i];
      const t = timestamps[i];
      if (c !== null && c !== undefined && Number.isFinite(c) && t) {
        const dateStr = new Date(t * 1000).toISOString().slice(0, 10);
        // Yahoo chart ya entrega `close` ajustado por splits. Volver a aplicar
        // los eventos aquí reducía AAPL/NVDA una segunda vez y corrompía el PER.
        points.push({ date: dateStr, close: Number((c * quoteCurrency.multiplier).toFixed(4)) });
      }
    }
    return points.length > 0
      ? { points, currency: quoteCurrency.currency, splits }
      : null;
  } catch {
    // Se prueba el host alternativo.
  }
  return null;
}

async function fetchMarketPriceSeries(symbol: string): Promise<MarketPricePayload | null> {
  const [longTerm, mediumTerm, recent] = await Promise.all([
    fetchYahooSegment(symbol, "1mo", "max"),
    fetchYahooSegment(symbol, "1wk", "10y"),
    fetchYahooSegment(symbol, "1d", "1y"),
  ]);
  const available = [longTerm, mediumTerm, recent].filter((segment): segment is MarketPricePayload => Boolean(segment));
  if (available.length === 0) return null;
  const points = stitchPriceSegments(available.map((segment) => segment.points));
  const splitMap = new Map<string, SplitEvent>();
  for (const segment of available) for (const split of segment.splits) {
    splitMap.set(`${split.date}:${split.numerator}:${split.denominator}`, split);
  }
  return {
    points,
    currency: recent?.currency ?? mediumTerm?.currency ?? longTerm?.currency ?? null,
    splits: [...splitMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/**
 * Serie de cierres semanales ajustados por splits.
 */
export async function getPriceSeries(ticker: string): Promise<PriceResult> {
  const symbol = ticker.trim().toUpperCase();
  const cache = getCacheStore();
  const cacheKey = `prices:series:v5:${symbol}`;

  const cached = await cache.get<PriceResult>(cacheKey);
  if (cached?.ok) return cached;

  // 1. Yahoo aporta moneda y varias granularidades; es la fuente principal.
  const market = await fetchMarketPriceSeries(symbol);
  if (market) {
    const result: PriceResult = {
      ok: true,
      series: {
        ticker: symbol,
        points: market.points,
        currency: market.currency,
        splits: market.splits,
        source: "Yahoo Finance (diario 1 año · semanal 10 años · mensual histórico)",
      },
    };
    await cache.set(cacheKey, result, TTL.prices);
    return result;
  }

  // 2. Alpha Vantage queda como respaldo si Yahoo no está disponible.
  const key = process.env.ALPHAVANTAGE_API_KEY?.trim();
  if (key) {
    try {
      const url =
        `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY_ADJUSTED` +
        `&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`;
      const res = await fetchWithTimeout(url, { cache: "no-store" });
      if (res.ok) {
        const parsed = parseAlphaVantage((await res.json()) as AlphaVantagePayload);
        if (parsed.ok && parsed.points.length > 0) {
          const result: PriceResult = {
            ok: true,
            series: { ticker: symbol, points: parsed.points, currency: null, splits: [], source: "Alpha Vantage" },
          };
          await cache.set(cacheKey, result, TTL.prices);
          return result;
        }
      }
    } catch {
      // Fallback a mercado público
    }
  }

  return { ok: false, reason: "not-found", ticker: symbol };
}

/**
 * Serie mensual completa para análisis masivo. Conserva el histórico y los
 * splits necesarios para el PER, pero evita las otras dos peticiones de mayor
 * granularidad que solo necesita el gráfico interactivo del perfil.
 */
export async function getCompactPriceSeries(ticker: string): Promise<PriceResult> {
  const symbol = ticker.trim().toUpperCase();
  const cache = getCacheStore();
  const cacheKey = `prices:compact:v1:${symbol}`;
  const cached = await cache.get<PriceResult>(cacheKey);
  if (cached?.ok) return cached;

  const market = await fetchYahooSegment(symbol, "1mo", "max");
  if (!market) return { ok: false, reason: "not-found", ticker: symbol };
  const result: PriceResult = {
    ok: true,
    series: {
      ticker: symbol,
      points: market.points,
      currency: market.currency,
      splits: market.splits,
      source: "Yahoo Finance (mensual histórico · screener)",
    },
  };
  await cache.set(cacheKey, result, TTL.prices);
  return result;
}
