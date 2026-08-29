import { getCacheStore, TTL } from "@/lib/cache/store";
import { fetchWithTimeout } from "@/lib/http";

export type LiveQuote = {
  ticker: string;
  price: number;
  previousClose: number | null;
  changePct: number | null;
  currency: string;
  marketCap?: number;
  sparkline: number[];
  date: string;
  source: "Yahoo Finance";
};

export function previousTradingCloseFromChart(
  marketTime: number | undefined,
  timestamps: number[],
  closes: Array<number | null>,
): number | null {
  const observations = timestamps.flatMap((timestamp, index) => {
    const close = closes[index];
    return close !== null && close !== undefined && Number.isFinite(close) && close > 0
      ? [{ timestamp, close }]
      : [];
  });
  if (observations.length === 0) return null;
  if (!marketTime) return observations.at(-1)?.close ?? null;

  const marketDate = new Date(marketTime * 1000).toISOString().slice(0, 10);
  const previous = observations.findLast((observation) =>
    new Date(observation.timestamp * 1000).toISOString().slice(0, 10) < marketDate,
  );
  return previous?.close ?? null;
}

/**
 * Obtiene la cotización real y datos de mercado verificables para un ticker.
 * Nunca inventa un valor: si el proveedor falla o no responde, devuelve null.
 */
export async function getLiveQuote(
  ticker: string,
  options: { freshness?: "standard" | "alert" } = {},
): Promise<LiveQuote | null> {
  const normTicker = ticker.trim().toUpperCase();
  const cache = getCacheStore();
  const alertFreshness = options.freshness === "alert";
  const cacheKey = alertFreshness
    ? `quotes:alert:v1:${normTicker}`
    : `quotes:live:v2:${normTicker}`;

  const cached = await cache.get<LiveQuote>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normTicker)}?interval=1d&range=1mo`;
    const res = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = (await res.json()) as {
      chart?: {
        result?: [
          {
            meta: {
              regularMarketPrice?: number;
              chartPreviousClose?: number;
              previousClose?: number;
              currency?: string;
              regularMarketTime?: number;
            };
            timestamp?: number[];
            indicators?: {
              quote?: [
                {
                  close?: (number | null)[];
                },
              ];
            };
          },
        ];
        error?: unknown;
      };
    };

    const result = json.chart?.result?.[0];
    if (!result || !result.meta) return null;

    const price = result.meta.regularMarketPrice;
    if (price === undefined || !Number.isFinite(price)) return null;

    const rawCloses = result.indicators?.quote?.[0]?.close ?? [];
    const prevClose = previousTradingCloseFromChart(
      result.meta.regularMarketTime,
      result.timestamp ?? [],
      rawCloses,
    ) ?? result.meta.previousClose ?? null;
    const changePct = prevClose !== null && prevClose > 0
      ? ((price - prevClose) / prevClose) * 100
      : null;

    const sparkline = rawCloses
      .filter((c): c is number => c !== null && c !== undefined && Number.isFinite(c))
      .slice(-30);

    const timestamp = result.meta.regularMarketTime
      ? new Date(result.meta.regularMarketTime * 1000).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const quote: LiveQuote = {
      ticker: normTicker,
      price,
      previousClose: prevClose,
      changePct,
      currency: result.meta.currency ?? "USD",
      sparkline,
      date: timestamp,
      source: "Yahoo Finance",
    };

    await cache.set(cacheKey, quote, alertFreshness ? TTL.alertQuotes : TTL.quotes);
    return quote;
  } catch {
    return null;
  }
}
