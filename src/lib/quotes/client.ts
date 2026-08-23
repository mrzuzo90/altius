import { getCacheStore, TTL } from "@/lib/cache/store";

export type LiveQuote = {
  ticker: string;
  price: number;
  previousClose: number;
  changePct: number;
  currency: string;
  marketCap?: number;
  sparkline: number[];
  date: string;
};

/**
 * Obtiene la cotización real y datos de mercado verificables para un ticker.
 * Nunca inventa un valor: si el proveedor falla o no responde, devuelve null.
 */
export async function getLiveQuote(ticker: string): Promise<LiveQuote | null> {
  const normTicker = ticker.trim().toUpperCase();
  const cache = getCacheStore();
  const cacheKey = `quotes:live:${normTicker}`;

  const cached = await cache.get<LiveQuote>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normTicker)}?interval=1d&range=1mo`;
    const res = await fetch(url, {
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

    const prevClose = result.meta.previousClose ?? result.meta.chartPreviousClose ?? price;
    const changePct = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

    const rawCloses = result.indicators?.quote?.[0]?.close ?? [];
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
    };

    await cache.set(cacheKey, quote, TTL.quotes);
    return quote;
  } catch {
    return null;
  }
}
