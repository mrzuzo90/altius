import { getCacheStore, TTL } from "@/lib/cache/store";
import { parseAlphaVantage, type AlphaVantagePayload } from "./alpha-vantage";
import type { PriceResult } from "./types";

export type { PricePoint, PriceSeries, PriceResult } from "./types";

/**
 * Serie de cierres semanales.
 *
 * Se usa la serie SEMANAL y no la diaria por una razón medida: en el plan
 * gratuito de Alpha Vantage, `outputsize=full` es una función de pago para el
 * endpoint diario, que queda limitado a unas cien sesiones —cinco meses— y deja
 * sin sentido cualquier rango de años. La serie semanal sí devuelve el
 * histórico completo: veintisiete años en el caso de Apple.
 *
 * Para un terminal de análisis fundamental el compromiso es favorable: importa
 * la tendencia plurianual junto a los estados financieros, no el tick del día.
 *
 * Se pide la variante AJUSTADA, que también es gratuita —solo la diaria ajustada
 * pasó a ser de pago—. Sin ajustar, cada split dibuja un desplome que nunca
 * ocurrió: NVIDIA aparecería hoy por debajo de su precio de 2021.
 *
 * Sin proveedor configurado no se inventa nada ni se cae la página: se devuelve
 * un resultado negativo tipado y el perfil se renderiza sin gráfico.
 *
 * Nota sobre Stooq: se descartó como fuente porque desde 2026 sirve un reto de
 * prueba de trabajo en JavaScript para bloquear el acceso automatizado. Sortear
 * ese control sería evadir una medida antibot deliberada del sitio.
 */
export async function getPriceSeries(ticker: string): Promise<PriceResult> {
  const key = process.env.ALPHAVANTAGE_API_KEY?.trim();
  if (!key) return { ok: false, reason: "no-provider" };

  const symbol = ticker.trim().toUpperCase();
  const cache = getCacheStore();
  const cacheKey = `prices:alphavantage:weekly-adjusted:${symbol}`;

  const cached = await cache.get<PriceResult>(cacheKey);
  if (cached?.ok) return cached;

  try {
    const url =
      `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY_ADJUSTED` +
      `&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`;
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
