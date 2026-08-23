import { getCacheStore, TTL } from "@/lib/cache/store";
import { parseAlphaVantage, type AlphaVantagePayload } from "./alpha-vantage";
import type { PricePoint, PriceResult } from "./types";

export type { PricePoint, PriceSeries, PriceResult } from "./types";

/**
 * Consulta la serie histórica de precios de mercado mediante feed público.
 */
async function fetchMarketPriceSeries(symbol: string): Promise<PricePoint[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1wk&range=5y`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const json = (await res.json()) as {
      chart?: {
        result?: [
          {
            timestamp?: number[];
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
    const adjcloses = result?.indicators?.adjclose?.[0]?.adjclose;
    const closes = adjcloses ?? result?.indicators?.quote?.[0]?.close ?? [];

    const points: PricePoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const c = closes[i];
      const t = timestamps[i];
      if (c !== null && c !== undefined && Number.isFinite(c) && t) {
        const dateStr = new Date(t * 1000).toISOString().slice(0, 10);
        points.push({ date: dateStr, close: Number(c.toFixed(2)) });
      }
    }
    return points;
  } catch {
    return [];
  }
}

/**
 * Serie de cierres semanales ajustados por splits y dividendos.
 */
export async function getPriceSeries(ticker: string): Promise<PriceResult> {
  const symbol = ticker.trim().toUpperCase();
  const cache = getCacheStore();
  const cacheKey = `prices:series:v2:${symbol}`;

  const cached = await cache.get<PriceResult>(cacheKey);
  if (cached?.ok) return cached;

  // 1. Intentar con Alpha Vantage si la clave de API está configurada
  const key = process.env.ALPHAVANTAGE_API_KEY?.trim();
  if (key) {
    try {
      const url =
        `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY_ADJUSTED` +
        `&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const parsed = parseAlphaVantage((await res.json()) as AlphaVantagePayload);
        if (parsed.ok && parsed.points.length > 0) {
          const result: PriceResult = {
            ok: true,
            series: { ticker: symbol, points: parsed.points, source: "Alpha Vantage" },
          };
          await cache.set(cacheKey, result, TTL.prices);
          return result;
        }
      }
    } catch {
      // Fallback a mercado público
    }
  }

  // 2. Feed de mercado público en tiempo real
  const marketPoints = await fetchMarketPriceSeries(symbol);
  if (marketPoints.length > 0) {
    const result: PriceResult = {
      ok: true,
      series: { ticker: symbol, points: marketPoints, source: "Mercado Oficial (Yahoo Finance)" },
    };
    await cache.set(cacheKey, result, TTL.prices);
    return result;
  }

  return { ok: false, reason: "not-found", ticker: symbol };
}
