import { getCacheStore, TTL } from "@/lib/cache/store";
import { parseFredCsv, type FredPoint } from "@/lib/fred/client";
import type { PricePoint } from "@/lib/prices/types";
import { buildTechnicalDataset } from "@/lib/technical";
import type {
  IndexDetailResult,
  IndexSummary,
  MarketIndexMeta,
  MarketIndexRegion,
  MarketIndexSymbol,
} from "./types";

export * from "./types";

export const MARKET_INDICES: Record<MarketIndexSymbol, MarketIndexMeta> = {
  // EE. UU.
  SP500: {
    symbol: "SP500",
    slug: "sp500",
    name: "S&P 500 Index",
    shortName: "S&P 500",
    region: "us",
    country: "Estados Unidos",
    currency: "USD",
    fredSeriesId: "SP500",
    provider: "S&P Dow Jones Indices LLC",
    description:
      "Índice de referencia compuesto por las 500 mayores corporaciones de Wall Street. Representa más del 80% de la capitalización bursátil estadounidense.",
    benchmarkTicker: "SPY",
  },
  NASDAQCOM: {
    symbol: "NASDAQCOM",
    slug: "nasdaq",
    name: "NASDAQ Composite Index",
    shortName: "NASDAQ",
    region: "us",
    country: "Estados Unidos",
    currency: "USD",
    fredSeriesId: "NASDAQCOM",
    provider: "NASDAQ OMX Group",
    description:
      "Índice que agrupa a más de 3.000 acciones cotizadas en el mercado electrónico NASDAQ, con alto peso en semiconductores, software y tecnología.",
    benchmarkTicker: "QQQ",
  },
  DJIA: {
    symbol: "DJIA",
    slug: "dow-jones",
    name: "Dow Jones Industrial Average",
    shortName: "Dow Jones",
    region: "us",
    country: "Estados Unidos",
    currency: "USD",
    fredSeriesId: "DJIA",
    provider: "S&P Dow Jones Indices LLC",
    description:
      "El selectivo más antiguo de Wall Street, ponderado por precio sobre 30 compañías industriales, financieras y de servicios emblemáticas.",
    benchmarkTicker: "DIA",
  },
  VIXCLS: {
    symbol: "VIXCLS",
    slug: "vix",
    name: "CBOE Volatility Index (VIX)",
    shortName: "VIX",
    region: "us",
    country: "Estados Unidos",
    currency: "PTS",
    fredSeriesId: "VIXCLS",
    provider: "Chicago Board Options Exchange (CBOE)",
    description:
      "Medida líder de volatilidad implícita esperada a 30 días calculada a partir de las opciones sobre el S&P 500, conocida como el termómetro del miedo.",
    isVolatilityIndex: true,
  },

  // Europa
  STOXX50E: {
    symbol: "STOXX50E",
    slug: "eurostoxx50",
    name: "Euro Stoxx 50 Index",
    shortName: "Euro Stoxx 50",
    region: "europe",
    country: "Eurozona",
    currency: "EUR",
    fredSeriesId: "SPASTT01EZM661N",
    provider: "STOXX Ltd. (Deutsche Börse Group)",
    description:
      "Índice bursátil de referencia de la Eurozona compuesto por 50 de las empresas más grandes y líquidas de 8 países europeos.",
    benchmarkTicker: "FEZ",
  },
  DAX: {
    symbol: "DAX",
    slug: "dax",
    name: "DAX 40 Index (Alemania)",
    shortName: "DAX 40",
    region: "europe",
    country: "Alemania",
    currency: "EUR",
    fredSeriesId: "SPASTT01DEM661N",
    provider: "Deutsche Börse",
    description:
      "Índice director de la economía alemana que agrupa a las 40 mayores compañías cotizadas en la Bolsa de Frankfurt (SAP, Siemens, Allianz, etc.).",
    benchmarkTicker: "EWG",
  },
  IBEX35: {
    symbol: "IBEX35",
    slug: "ibex35",
    name: "IBEX 35 Index (España)",
    shortName: "IBEX 35",
    region: "europe",
    country: "España",
    currency: "EUR",
    fredSeriesId: "SPASTT01ESM661N",
    provider: "BME - Bolsas y Mercados Españoles",
    description:
      "Selectivo de las 35 empresas con mayor liquidez cotizadas en el Sistema de Interconexión Bursátil Español (SIBE) en Madrid.",
    benchmarkTicker: "EWP",
  },
  FTSE100: {
    symbol: "FTSE100",
    slug: "ftse100",
    name: "FTSE 100 Index (Reino Unido)",
    shortName: "FTSE 100",
    region: "europe",
    country: "Reino Unido",
    currency: "GBP",
    fredSeriesId: "SPASTT01GBM661N",
    provider: "FTSE Russell (LSE Group)",
    description:
      "Índice ponderado por capitalización de las 100 mayores empresas cotizadas en la Bolsa de Valores de Londres (London Stock Exchange).",
    benchmarkTicker: "EWU",
  },
  CAC40: {
    symbol: "CAC40",
    slug: "cac40",
    name: "CAC 40 Index (Francia)",
    shortName: "CAC 40",
    region: "europe",
    country: "Francia",
    currency: "EUR",
    fredSeriesId: "SPASTT01FRM661N",
    provider: "Euronext Paris",
    description:
      "Índice de referencia de la Bolsa de París que agrupa a los 40 valores más significativos de Francia (LVMH, TotalEnergies, Sanofi, L'Oréal).",
    benchmarkTicker: "EWQ",
  },
};

/** Mapeo exhaustivo de alias para resolución unificada */
const INDEX_ALIASES: Record<string, MarketIndexSymbol> = {
  // US
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

  // Europa
  EUROSTOXX: "STOXX50E",
  EUROSTOXX50: "STOXX50E",
  "EURO STOXX": "STOXX50E",
  "EURO STOXX 50": "STOXX50E",
  STOXX50: "STOXX50E",
  STOXX50E: "STOXX50E",
  SX5E: "STOXX50E",
  "^STOXX50E": "STOXX50E",
  FEZ: "STOXX50E",
  DAX: "DAX",
  DAX40: "DAX",
  "DAX 40": "DAX",
  DAX30: "DAX",
  GDAXI: "DAX",
  "^GDAXI": "DAX",
  EWG: "DAX",
  IBEX: "IBEX35",
  IBEX35: "IBEX35",
  "IBEX 35": "IBEX35",
  "IBEX-35": "IBEX35",
  "^IBEX": "IBEX35",
  "IBEX.MC": "IBEX35",
  EWP: "IBEX35",
  FTSE: "FTSE100",
  FTSE100: "FTSE100",
  "FTSE 100": "FTSE100",
  UK100: "FTSE100",
  "^FTSE": "FTSE100",
  EWU: "FTSE100",
  CAC: "CAC40",
  CAC40: "CAC40",
  "CAC 40": "CAC40",
  PX1: "CAC40",
  "^FCHI": "CAC40",
  EWQ: "CAC40",
};

export function resolveIndexSymbol(query: string): MarketIndexMeta | null {
  const norm = query.trim().toUpperCase().replace(/[\^]/g, "");
  const foundSymbol =
    INDEX_ALIASES[norm] ??
    INDEX_ALIASES[query.trim().toUpperCase()] ??
    (Object.values(MARKET_INDICES).find((m) => m.slug.toLowerCase() === query.trim().toLowerCase())
      ?.symbol as MarketIndexSymbol | undefined);

  if (foundSymbol && MARKET_INDICES[foundSymbol]) {
    return MARKET_INDICES[foundSymbol];
  }
  return null;
}

export function getAllMarketIndices(region?: MarketIndexRegion): MarketIndexMeta[] {
  const list = Object.values(MARKET_INDICES);
  return region ? list.filter((i) => i.region === region) : list;
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
    slug: meta.slug,
    name: meta.name,
    shortName: meta.shortName,
    region: meta.region,
    country: meta.country,
    currency: meta.currency,
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
 * Obtiene el resumen de todos los índices para la vista general (opcionalmente filtrado por región).
 */
export async function getAllIndicesSummary(region?: MarketIndexRegion): Promise<IndexSummary[]> {
  const symbols = Object.keys(MARKET_INDICES) as MarketIndexSymbol[];
  const filtered = region ? symbols.filter((s) => MARKET_INDICES[s].region === region) : symbols;

  const summaries = await Promise.all(
    filtered.map(async (sym) => {
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
