import { getCacheStore, TTL } from "@/lib/cache/store";
import { parseFredCsv, type FredPoint } from "@/lib/fred/client";
import type { PricePoint } from "@/lib/prices/types";
import { buildTechnicalDataset } from "@/lib/technical";
import type {
  IndexDetailResult,
  IndexSummary,
  MarketIndexMeta,
  MarketIndexSymbol,
} from "./types";

export * from "./types";

export const MARKET_INDICES: Record<MarketIndexSymbol, MarketIndexMeta> = {
  SP500: {
    symbol: "SP500",
    slug: "sp500",
    name: "S&P 500 Index",
    shortName: "S&P 500",
    fredSeriesId: "SP500",
    provider: "S&P Dow Jones Indices LLC",
    description:
      "Índice de referencia compuesto por las 500 mayores corporaciones de Wall Street. Representa más del 80% de la capitalización del mercado bursátil estadounidense.",
    benchmarkTicker: "SPY",
  },
  NASDAQCOM: {
    symbol: "NASDAQCOM",
    slug: "nasdaq",
    name: "NASDAQ Composite Index",
    shortName: "NASDAQ",
    fredSeriesId: "NASDAQCOM",
    provider: "NASDAQ OMX Group",
    description:
      "Índice que agrupa a más de 3.000 acciones cotizadas en el mercado electrónico NASDAQ, con una alta concentración en semiconductores, software y gigantes de internet.",
    benchmarkTicker: "QQQ",
  },
  DJIA: {
    symbol: "DJIA",
    slug: "dow-jones",
    name: "Dow Jones Industrial Average",
    shortName: "Dow Jones",
    fredSeriesId: "DJIA",
    provider: "S&P Dow Jones Indices LLC",
    description:
      "El índice bursátil más antiguo de Wall Street, ponderado por precio sobre 30 compañías industriales, financieras y de servicios emblemáticas de EE. UU.",
    benchmarkTicker: "DIA",
  },
  VIXCLS: {
    symbol: "VIXCLS",
    slug: "vix",
    name: "CBOE Volatility Index (VIX)",
    shortName: "VIX",
    fredSeriesId: "VIXCLS",
    provider: "Chicago Board Options Exchange (CBOE)",
    description:
      "Medida líder de la volatilidad implícita esperada a 30 días calculada a partir de los contratos de opciones sobre el S&P 500, conocido como el termómetro del miedo.",
    isVolatilityIndex: true,
  },
};

/** Mapeo de alias o símbolos habituales a nuestros símbolos oficiales */
const INDEX_ALIASES: Record<string, MarketIndexSymbol> = {
  SP500: "SP500",
  "S&P500": "SP500",
  "S&P 500": "SP500",
  GSPC: "SP500",
  "^GSPC": "SP500",
  SPX: "SP500",
  SPY: "SP500",
  NASDAQ: "NASDAQCOM",
  NASDAQCOM: "NASDAQCOM",
  NASDAC: "NASDAQCOM",
  COMP: "NASDAQCOM",
  IXIC: "NASDAQCOM",
  "^IXIC": "NASDAQCOM",
  NDX: "NASDAQCOM",
  QQQ: "NASDAQCOM",
  DOW: "DJIA",
  DJIA: "DJIA",
  DOWJONES: "DJIA",
  "DOW JONES": "DJIA",
  "^DJI": "DJIA",
  DIA: "DJIA",
  VIX: "VIXCLS",
  VIXCLS: "VIXCLS",
  "^VIX": "VIXCLS",
};

export function resolveIndexSymbol(query: string): MarketIndexMeta | null {
  const norm = query.trim().toUpperCase().replace(/[\^]/g, "");
  const foundSymbol = INDEX_ALIASES[norm] ?? INDEX_ALIASES[query.trim().toUpperCase()];
  if (foundSymbol && MARKET_INDICES[foundSymbol]) {
    return MARKET_INDICES[foundSymbol];
  }
  return null;
}

export function getAllMarketIndices(): MarketIndexMeta[] {
  return Object.values(MARKET_INDICES);
}

/**
 * Obtiene la serie histórica de un índice bursátil desde FRED.
 */
export async function getIndexSeries(symbol: MarketIndexSymbol): Promise<PricePoint[]> {
  const meta = MARKET_INDICES[symbol];
  if (!meta) throw new Error(`Índice no reconocido: ${symbol}`);

  const cache = getCacheStore();
  const cacheKey = `indices:series:${symbol}`;
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
  await cache.set(cacheKey, points, TTL.indices);
  return points;
}

/**
 * Calcula el resumen de métricas y variaciones para un índice bursátil.
 */
export function computeIndexSummary(
  symbol: MarketIndexSymbol,
  points: PricePoint[],
): IndexSummary {
  const meta = MARKET_INDICES[symbol];
  const lastPoint = points.at(-1);
  const currentValue = lastPoint?.close ?? 0;
  const currentDate = lastPoint?.date ?? "";

  // Variaciones
  const prev1D = points.length >= 2 ? points[points.length - 2].close : null;
  const prev1W = points.length >= 6 ? points[points.length - 6].close : null;
  const prev1M = points.length >= 22 ? points[points.length - 22].close : null;
  const prev1Y = points.length >= 253 ? points[points.length - 253].close : null;
  const prev5Y = points.length >= 1260 ? points[points.length - 1260].close : null;

  // YTD (inicio del año de la última observación)
  const currentYear = currentDate.slice(0, 4);
  const firstOfYear = points.find((p) => p.date.startsWith(currentYear))?.close ?? null;

  // ATH y Rango 52 semanas
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

  // Volatilidad anualizada (252 días hábiles)
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

  // Sparkline de los últimos 30 días
  const sparkline = points.slice(-30).map((p) => p.close);

  return {
    symbol,
    name: meta.name,
    shortName: meta.shortName,
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
 * Obtiene el detalle completo de un índice con sus indicadores técnicos calculados.
 */
export async function getIndexDetail(symbol: MarketIndexSymbol): Promise<IndexDetailResult> {
  const meta = MARKET_INDICES[symbol];
  if (!meta) throw new Error(`Índice no soportado: ${symbol}`);

  const points = await getIndexSeries(symbol);
  const summary = computeIndexSummary(symbol, points);
  const technical = buildTechnicalDataset(meta.shortName, meta.provider, points);

  return {
    meta,
    summary,
    technical,
    points,
  };
}

/**
 * Obtiene el resumen de todos los índices principales para la vista general.
 */
export async function getAllIndicesSummary(): Promise<IndexSummary[]> {
  const symbols = Object.keys(MARKET_INDICES) as MarketIndexSymbol[];
  const summaries = await Promise.all(
    symbols.map(async (sym) => {
      try {
        const points = await getIndexSeries(sym);
        return computeIndexSummary(sym, points);
      } catch {
        return null;
      }
    }),
  );
  return summaries.filter((s): s is IndexSummary => s !== null);
}
