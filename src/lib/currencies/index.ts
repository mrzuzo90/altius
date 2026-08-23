import { getCacheStore, TTL } from "@/lib/cache/store";
import { parseFredCsv, type FredPoint } from "@/lib/fred/client";
import type { PricePoint } from "@/lib/prices/types";
import { buildTechnicalDataset } from "@/lib/technical";
import type {
  CurrencyDetailResult,
  CurrencyPairMeta,
  CurrencyPairSymbol,
  CurrencySummary,
} from "./types";

export * from "./types";

export const CURRENCY_PAIRS: Record<CurrencyPairSymbol, CurrencyPairMeta> = {
  EURUSD: {
    symbol: "EURUSD",
    slug: "eur-usd",
    name: "Euro / Dólar Estadounidense (EUR/USD)",
    shortName: "EUR/USD",
    baseCurrency: "EUR",
    quoteCurrency: "USD",
    fredSeriesId: "DEXUSEU",
    provider: "Board of Governors of the Federal Reserve System (H.10 Release)",
    description:
      "Tipo de cambio oficial de referencia del Euro frente al Dólar estadounidense publicado diariamente por la Reserva Federal.",
  },
  GBPUSD: {
    symbol: "GBPUSD",
    slug: "gbp-usd",
    name: "Libra Esterlina / Dólar Estadounidense (GBP/USD)",
    shortName: "GBP/USD",
    baseCurrency: "GBP",
    quoteCurrency: "USD",
    fredSeriesId: "DEXUSUK",
    provider: "Board of Governors of the Federal Reserve System (H.10 Release)",
    description:
      "Cotización oficial de la Libra esterlina británica expresada en Dólares estadounidenses.",
  },
  USDJPY: {
    symbol: "USDJPY",
    slug: "usd-jpy",
    name: "Dólar Estadounidense / Yen Japonés (USD/JPY)",
    shortName: "USD/JPY",
    baseCurrency: "USD",
    quoteCurrency: "JPY",
    fredSeriesId: "DEXJPUS",
    provider: "Board of Governors of the Federal Reserve System (H.10 Release)",
    description:
      "Tipo de cambio de referencia del Dólar estadounidense frente al Yen japonés fijado por el Banco de la Reserva Federal.",
  },
  USDCHF: {
    symbol: "USDCHF",
    slug: "usd-chf",
    name: "Dólar Estadounidense / Franco Suizo (USD/CHF)",
    shortName: "USD/CHF",
    baseCurrency: "USD",
    quoteCurrency: "CHF",
    fredSeriesId: "DEXSZUS",
    provider: "Board of Governors of the Federal Reserve System (H.10 Release)",
    description:
      "Cotización del Dólar estadounidense en Francos suizos, activo de reserva y refugio tradicional.",
  },
  USDCAD: {
    symbol: "USDCAD",
    slug: "usd-cad",
    name: "Dólar Estadounidense / Dólar Canadiense (USD/CAD)",
    shortName: "USD/CAD",
    baseCurrency: "USD",
    quoteCurrency: "CAD",
    fredSeriesId: "DEXCAUS",
    provider: "Board of Governors of the Federal Reserve System (H.10 Release)",
    description:
      "Tipo de cambio de referencia entre las economías de América del Norte (USD/CAD).",
  },
  USDCNY: {
    symbol: "USDCNY",
    slug: "usd-cny",
    name: "Dólar Estadounidense / Yuan Chino (USD/CNY)",
    shortName: "USD/CNY",
    baseCurrency: "USD",
    quoteCurrency: "CNY",
    fredSeriesId: "DEXCHUS",
    provider: "Board of Governors of the Federal Reserve System (H.10 Release)",
    description:
      "Tipo de cambio del Dólar estadounidense frente al Yuan Renminbi de la República Popular China.",
  },
  USDMXN: {
    symbol: "USDMXN",
    slug: "usd-mxn",
    name: "Dólar Estadounidense / Peso Mexicano (USD/MXN)",
    shortName: "USD/MXN",
    baseCurrency: "USD",
    quoteCurrency: "MXN",
    fredSeriesId: "DEXMXUS",
    provider: "Board of Governors of the Federal Reserve System (H.10 Release)",
    description:
      "Tipo de cambio representativo del Dólar estadounidense frente al Peso mexicano.",
  },
  DXY: {
    symbol: "DXY",
    slug: "dxy",
    name: "Índice Dólar Ponderado (DXY Benchmark)",
    shortName: "Índice DXY",
    baseCurrency: "USD",
    quoteCurrency: "PTS",
    fredSeriesId: "DTWEXAFEGS",
    provider: "Federal Reserve Economic Data (FRED)",
    description:
      "Índice ponderado por el comercio exterior de EE. UU. que mide la fortaleza global del dólar frente a las principales divisas mundiales.",
    isIndex: true,
  },
};

const CURRENCY_ALIASES: Record<string, CurrencyPairSymbol> = {
  EURUSD: "EURUSD",
  "EUR/USD": "EURUSD",
  "EUR-USD": "EURUSD",
  EURO: "EURUSD",
  EUR: "EURUSD",
  GBPUSD: "GBPUSD",
  "GBP/USD": "GBPUSD",
  "GBP-USD": "GBPUSD",
  LIBRA: "GBPUSD",
  GBP: "GBPUSD",
  USDJPY: "USDJPY",
  "USD/JPY": "USDJPY",
  "USD-JPY": "USDJPY",
  YEN: "USDJPY",
  JPY: "USDJPY",
  USDCHF: "USDCHF",
  "USD/CHF": "USDCHF",
  "USD-CHF": "USDCHF",
  FRANCO: "USDCHF",
  CHF: "USDCHF",
  USDCAD: "USDCAD",
  "USD/CAD": "USDCAD",
  "USD-CAD": "USDCAD",
  CAD: "USDCAD",
  USDCNY: "USDCNY",
  "USD/CNY": "USDCNY",
  "USD-CNY": "USDCNY",
  YUAN: "USDCNY",
  CNY: "USDCNY",
  USDMXN: "USDMXN",
  "USD/MXN": "USDMXN",
  "USD-MXN": "USDMXN",
  PESO: "USDMXN",
  MXN: "USDMXN",
  DXY: "DXY",
  "INDICE DOLAR": "DXY",
  "US DOLLAR INDEX": "DXY",
  DOLAR: "DXY",
};

export function resolveCurrencySymbol(query: string): CurrencyPairMeta | null {
  const norm = query.trim().toUpperCase().replace(/[\^/_\- ]/g, "");
  const foundSymbol =
    CURRENCY_ALIASES[norm] ??
    CURRENCY_ALIASES[query.trim().toUpperCase()] ??
    (Object.values(CURRENCY_PAIRS).find(
      (m) =>
        m.slug.toLowerCase() === query.trim().toLowerCase() ||
        m.shortName.toLowerCase() === query.trim().toLowerCase(),
    )?.symbol as CurrencyPairSymbol | undefined);

  if (foundSymbol && CURRENCY_PAIRS[foundSymbol]) {
    return CURRENCY_PAIRS[foundSymbol];
  }
  return null;
}

export function getAllCurrencyPairs(): CurrencyPairMeta[] {
  return Object.values(CURRENCY_PAIRS);
}

/**
 * Obtiene la serie histórica de un tipo de cambio oficial desde FRED (H.10 Release).
 */
export async function getCurrencySeries(symbol: CurrencyPairSymbol): Promise<PricePoint[]> {
  const meta = CURRENCY_PAIRS[symbol];
  if (!meta) throw new Error(`Par de divisas no reconocido: ${symbol}`);

  const cache = getCacheStore();
  const cacheKey = `currencies:series:${symbol}`;
  const cached = await cache.get<PricePoint[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  const apiKey = process.env.FRED_API_KEY?.trim();
  let points: PricePoint[];

  if (apiKey) {
    const url =
      `https://api.stlouisfed.org/fred/series/observations?series_id=${meta.fredSeriesId}` +
      `&api_key=${encodeURIComponent(apiKey)}&file_type=json`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`FRED devolvió ${res.status} para ${meta.fredSeriesId}.`);
    const json = (await res.json()) as { observations: { date: string; value: string }[] };
    points = json.observations
      .filter((o) => o.value !== "." && o.value !== "")
      .map((o) => ({ date: o.date, close: Number.parseFloat(o.value) }))
      .filter((p) => Number.isFinite(p.close));
  } else {
    const res = await fetch(
      `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${meta.fredSeriesId}`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error(`FRED devolvió ${res.status} para ${meta.fredSeriesId}.`);
    const fredPoints: FredPoint[] = parseFredCsv(await res.text());
    points = fredPoints.map((fp) => ({ date: fp.date, close: fp.value }));
  }

  points.sort((a, b) => (a.date < b.date ? -1 : 1));
  await cache.set(cacheKey, points, TTL.currencies);
  return points;
}

/**
 * Calcula el resumen de métricas y variaciones para un tipo de cambio.
 */
export function computeCurrencySummary(
  symbol: CurrencyPairSymbol,
  points: PricePoint[],
): CurrencySummary {
  const meta = CURRENCY_PAIRS[symbol];
  const lastPoint = points.at(-1);
  const currentValue = lastPoint?.close ?? 0;
  const currentDate = lastPoint?.date ?? "";

  const prev1D = points.length >= 2 ? points[points.length - 2].close : null;
  const prev1W = points.length >= 6 ? points[points.length - 6].close : null;
  const prev1M = points.length >= 22 ? points[points.length - 22].close : null;
  const prev1Y = points.length >= 253 ? points[points.length - 253].close : null;
  const prev5Y = points.length >= 1260 ? points[points.length - 1260].close : null;

  const currentYear = currentDate.slice(0, 4);
  const firstOfYear = points.find((p) => p.date.startsWith(currentYear))?.close ?? null;

  const recent252 = points.slice(-252);
  const high52w = recent252.length > 0 ? Math.max(...recent252.map((p) => p.close)) : currentValue;
  const low52w = recent252.length > 0 ? Math.min(...recent252.map((p) => p.close)) : currentValue;

  let ath = 0;
  let athDate = "";
  for (const p of points) {
    if (p.close > ath) {
      ath = p.close;
      athDate = p.date;
    }
  }

  const drawdown = ath > 0 ? ((currentValue - ath) / ath) * 100 : 0;

  let vol = 0;
  if (recent252.length >= 20) {
    const returns: number[] = [];
    for (let i = 1; i < recent252.length; i++) {
      const prev = recent252[i - 1].close;
      if (prev > 0) returns.push((recent252[i].close - prev) / prev);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
    vol = Math.sqrt(variance) * Math.sqrt(252) * 100;
  }

  const sparkline = points.slice(-30).map((p) => p.close);

  return {
    symbol,
    slug: meta.slug,
    name: meta.name,
    shortName: meta.shortName,
    baseCurrency: meta.baseCurrency,
    quoteCurrency: meta.quoteCurrency,
    currentValue,
    date: currentDate,
    change1D: prev1D && prev1D > 0 ? ((currentValue - prev1D) / prev1D) * 100 : undefined,
    change1W: prev1W && prev1W > 0 ? ((currentValue - prev1W) / prev1W) * 100 : undefined,
    change1M: prev1M && prev1M > 0 ? ((currentValue - prev1M) / prev1M) * 100 : undefined,
    change1Y: prev1Y && prev1Y > 0 ? ((currentValue - prev1Y) / prev1Y) * 100 : undefined,
    change5Y: prev5Y && prev5Y > 0 ? ((currentValue - prev5Y) / prev5Y) * 100 : undefined,
    changeYTD: firstOfYear && firstOfYear > 0 ? ((currentValue - firstOfYear) / firstOfYear) * 100 : undefined,
    high52w,
    low52w,
    ath,
    athDate,
    drawdownFromAthPct: drawdown,
    annualizedVolatilityPct: vol,
    recentSparkline: sparkline,
    provider: meta.provider,
  };
}

/**
 * Obtiene el detalle completo de un par de divisas con dataset técnico.
 */
export async function getCurrencyDetail(symbol: CurrencyPairSymbol): Promise<CurrencyDetailResult> {
  const meta = CURRENCY_PAIRS[symbol];
  if (!meta) throw new Error(`Par de divisas no soportado: ${symbol}`);

  const points = await getCurrencySeries(symbol);
  const summary = computeCurrencySummary(symbol, points);
  const technical = buildTechnicalDataset(meta.shortName, meta.provider, points);

  return {
    meta,
    summary,
    technical,
    points,
  };
}

/**
 * Obtiene el resumen de todos los tipos de cambio para la vista general.
 */
export async function getAllCurrenciesSummary(): Promise<CurrencySummary[]> {
  const symbols = Object.keys(CURRENCY_PAIRS) as CurrencyPairSymbol[];

  const summaries = await Promise.all(
    symbols.map(async (sym) => {
      try {
        const points = await getCurrencySeries(sym);
        return computeCurrencySummary(sym, points);
      } catch {
        return null;
      }
    }),
  );
  return summaries.filter((s): s is CurrencySummary => s !== null);
}
