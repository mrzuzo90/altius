import { getCacheStore, TTL } from "@/lib/cache/store";
import { parseAlphaVantage, type AlphaVantagePayload } from "./alpha-vantage";
import type { PriceResult } from "./types";

export type { PricePoint, PriceSeries, PriceResult } from "./types";

/**
 * Serie diaria de cierres.
 *
 * Sin proveedor configurado no se inventa nada ni se cae la página: se devuelve
 * un resultado negativo tipado y el perfil se renderiza sin gráfico.
 *
 * Nota sobre Stooq: se descartó como fuente porque desde 2026 sirve un reto de
 * prueba de trabajo en JavaScript para bloquear el acceso automatizado. Sortear
 * ese control sería evadir una medida antibot deliberada del sitio.
 */
export async function getDailyPrices(ticker: string): Promise<PriceResult> {
  const key = process.env.ALPHAVANTAGE_API_KEY?.trim();
  if (!key) return { ok: false, reason: "no-provider" };

  const symbol = ticker.trim().toUpperCase();
  const cache = getCacheStore();
  const cacheKey = `prices:alphavantage:${symbol}`;

  const cached = await cache.get<PriceResult>(cacheKey);
  if (cached?.ok) return cached;

  try {
    const url =
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY` +
      `&symbol=${encodeURIComponent(symbol)}&outputsize=full&apikey=${encodeURIComponent(key)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return { ok: false, reason: "error", message: `El proveedor devolvió ${res.status}.` };
    }
    const parsed = parseAlphaVantage((await res.json()) as AlphaVantagePayload);
    if (!parsed.ok) {
      return parsed.reason === "not-found"
        ? { ok: false, reason: "not-found", ticker: symbol }
        : { ok: false, reason: parsed.reason, message: parsed.message };
    }
    const result: PriceResult = {
      ok: true,
      series: { ticker: symbol, points: parsed.points, source: "Alpha Vantage" },
    };
    await cache.set(cacheKey, result, TTL.prices);
    return result;
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
