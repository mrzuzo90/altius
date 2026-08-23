import { getCacheStore, TTL } from "@/lib/cache/store";
import { parseFredCsv, type FredPoint } from "@/lib/fred/client";
import type { PricePoint } from "@/lib/prices/types";
import { buildTechnicalDataset } from "@/lib/technical";
import type {
  CommodityCategory,
  CommodityDetailResult,
  CommodityMeta,
  CommoditySummary,
  CommoditySymbol,
} from "./types";

export * from "./types";

export const COMMODITIES: Record<CommoditySymbol, CommodityMeta> = {
  // Energía
  BRENT: {
    symbol: "BRENT",
    slug: "brent",
    name: "Petróleo Crudo Brent (Spot Europa)",
    shortName: "Petróleo Brent",
    category: "energy",
    unit: "USD / Barril",
    fredSeriesId: "DCOILBRENTEU",
    provider: "U.S. Energy Information Administration (EIA) via FRED",
    description:
      "Precio de contado del crudo del Mar del Norte (Brent), referencia oficial del mercado petrolero internacional y europeo.",
  },
  WTI: {
    symbol: "WTI",
    slug: "wti",
    name: "Petróleo Crudo WTI (Cushing, OK)",
    shortName: "Petróleo WTI",
    category: "energy",
    unit: "USD / Barril",
    fredSeriesId: "DCOILWTICO",
    provider: "U.S. Energy Information Administration (EIA) via FRED",
    description:
      "Precio de referencia del crudo ligero estadounidense (West Texas Intermediate) en el centro de entrega de Cushing, Oklahoma.",
  },
  NATGAS: {
    symbol: "NATGAS",
    slug: "gas-natural",
    name: "Gas Natural (Henry Hub Spot)",
    shortName: "Gas Natural",
    category: "energy",
    unit: "USD / MMBtu",
    fredSeriesId: "DHHNGSP",
    provider: "U.S. Energy Information Administration (EIA) via FRED",
    description:
      "Precio de contado del gas natural en el punto de distribución de Henry Hub (Luisiana), referencia mundial de gasoductos y GNL.",
  },

  // Metales Preciosos
  GOLD: {
    symbol: "GOLD",
    slug: "oro",
    name: "Oro Fino (LBMA Fixing)",
    shortName: "Oro",
    category: "precious_metals",
    unit: "USD / Onza Troy",
    fredSeriesId: "GOLDAMGBD228NLBM",
    provider: "London Bullion Market Association (LBMA) via FRED",
    description:
      "Precio oficial de liquidación del oro físico en el mercado mayorista de metales preciosos de Londres (LBMA Gold Price Fixing).",
  },
  SILVER: {
    symbol: "SILVER",
    slug: "plata",
    name: "Plata Fina (Mercado Global)",
    shortName: "Plata",
    category: "precious_metals",
    unit: "USD / Onza Troy",
    fredSeriesId: "PSILVERUSDM",
    provider: "Fondo Monetario Internacional (FMI) / LBMA via FRED",
    description:
      "Cotización de referencia de la plata física como metal precioso de inversión y componente clave en transición energética e industrial.",
  },

  // Metales Industriales
  COPPER: {
    symbol: "COPPER",
    slug: "cobre",
    name: "Cobre Grado A (Precio Global)",
    shortName: "Cobre",
    category: "industrial_metals",
    unit: "USD / Tonelada",
    fredSeriesId: "PCOPPUSDM",
    provider: "Fondo Monetario Internacional (FMI) via FRED",
    description:
      "Precio global del cobre de grado A en el mercado de metales de Londres (LME), considerado el barómetro de la actividad industrial mundial.",
  },

  // Agricultura
  WHEAT: {
    symbol: "WHEAT",
    slug: "trigo",
    name: "Trigo (Índice Global de Exportación)",
    shortName: "Trigo",
    category: "agriculture",
    unit: "USD / Tonelada",
    fredSeriesId: "PWHEAMTUSDM",
    provider: "Fondo Monetario Internacional (FMI) / Banco Mundial via FRED",
    description:
      "Precio de referencia internacional del trigo rojo duro de invierno, cereal base de la alimentación mundial.",
  },
  CORN: {
    symbol: "CORN",
    slug: "maiz",
    name: "Maíz (Índice Global de Exportación)",
    shortName: "Maíz",
    category: "agriculture",
    unit: "USD / Tonelada",
    fredSeriesId: "PMAIZMTUSDM",
    provider: "Fondo Monetario Internacional (FMI) / Banco Mundial via FRED",
    description:
      "Precio de exportación del maíz amarillo grado 2 de EE. UU., base fundamental de la cadena agroalimentaria y forrajera global.",
  },
};

const COMMODITY_ALIASES: Record<string, CommoditySymbol> = {
  BRENT: "BRENT",
  "PETROLEO BRENT": "BRENT",
  "CRUDO BRENT": "BRENT",
  OIL: "BRENT",
  PETROLEO: "BRENT",
  CRUDO: "BRENT",
  WTI: "WTI",
  "PETROLEO WTI": "WTI",
  "CRUDO WTI": "WTI",
  NATGAS: "NATGAS",
  "GAS NATURAL": "NATGAS",
  GAS: "NATGAS",
  HENRYHUB: "NATGAS",
  GOLD: "GOLD",
  ORO: "GOLD",
  XAU: "GOLD",
  "XAU/USD": "GOLD",
  SILVER: "SILVER",
  PLATA: "SILVER",
  XAG: "SILVER",
  "XAG/USD": "SILVER",
  COPPER: "COPPER",
  COBRE: "COPPER",
  WHEAT: "WHEAT",
  TRIGO: "WHEAT",
  CORN: "CORN",
  MAIZ: "CORN",
};

export function resolveCommoditySymbol(query: string): CommodityMeta | null {
  const norm = query.trim().toUpperCase().replace(/[\^]/g, "");
  const foundSymbol =
    COMMODITY_ALIASES[norm] ??
    COMMODITY_ALIASES[query.trim().toUpperCase()] ??
    (Object.values(COMMODITIES).find((m) => m.slug.toLowerCase() === query.trim().toLowerCase())
      ?.symbol as CommoditySymbol | undefined);

  if (foundSymbol && COMMODITIES[foundSymbol]) {
    return COMMODITIES[foundSymbol];
  }
  return null;
}

export function getAllCommodities(category?: CommodityCategory): CommodityMeta[] {
  const list = Object.values(COMMODITIES);
  return category ? list.filter((c) => c.category === category) : list;
}

/**
 * Obtiene la serie de precios oficial de una materia prima.
 */
export async function getCommoditySeries(symbol: CommoditySymbol): Promise<PricePoint[]> {
  const meta = COMMODITIES[symbol];
  if (!meta) throw new Error(`Materia prima no reconocida: ${symbol}`);

  const cache = getCacheStore();
  const cacheKey = `commodities:series:${symbol}`;
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
  await cache.set(cacheKey, points, TTL.commodities);
  return points;
}

/**
 * Calcula el resumen de métricas para una materia prima.
 */
export function computeCommoditySummary(
  symbol: CommoditySymbol,
  points: PricePoint[],
): CommoditySummary {
  const meta = COMMODITIES[symbol];
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
    category: meta.category,
    unit: meta.unit,
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
 * Obtiene el detalle completo de una materia prima con dataset técnico enriquecido.
 */
export async function getCommodityDetail(symbol: CommoditySymbol): Promise<CommodityDetailResult> {
  const meta = COMMODITIES[symbol];
  if (!meta) throw new Error(`Materia prima no soportada: ${symbol}`);

  const points = await getCommoditySeries(symbol);
  const summary = computeCommoditySummary(symbol, points);
  const technical = buildTechnicalDataset(meta.shortName, meta.provider, points);

  return {
    meta,
    summary,
    technical,
    points,
  };
}

/**
 * Obtiene el resumen de todas las materias primas para la vista general.
 */
export async function getAllCommoditiesSummary(category?: CommodityCategory): Promise<CommoditySummary[]> {
  const symbols = Object.keys(COMMODITIES) as CommoditySymbol[];
  const filtered = category ? symbols.filter((s) => COMMODITIES[s].category === category) : symbols;

  const summaries = await Promise.all(
    filtered.map(async (sym) => {
      try {
        const points = await getCommoditySeries(sym);
        return computeCommoditySummary(sym, points);
      } catch {
        return null;
      }
    }),
  );
  return summaries.filter((s): s is CommoditySummary => s !== null);
}
