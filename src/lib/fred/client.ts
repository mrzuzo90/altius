import { getCacheStore, TTL } from "@/lib/cache/store";
import { fetchWithTimeout } from "@/lib/http";

export type FredPoint = { date: string; value: number };

export type FredSeriesId =
  | "CPIAUCSL"
  | "FEDFUNDS"
  | "UNRATE"
  | "CP0000EZ19M086NEST"
  | "ECBMRRFR"
  | "ECBDFR"
  | "EZ_UNRATE";

export const FRED_SERIES: Record<
  FredSeriesId,
  { label: string; unit: string; description: string; yoy?: boolean }
> = {
  CPIAUCSL: {
    label: "Inflación EE.UU. (IPC)",
    unit: "índice 1982-84 = 100",
    description: "Índice de precios al consumo para consumidores urbanos de EE.UU., desestacionalizado.",
    yoy: true,
  },
  FEDFUNDS: {
    label: "Tipo de interés de la Fed",
    unit: "%",
    description: "Tipo efectivo de los fondos federales de EE.UU., media mensual.",
  },
  UNRATE: {
    label: "Desempleo EE.UU.",
    unit: "%",
    description: "Tasa de paro civil en Estados Unidos, desestacionalizada.",
  },
  CP0000EZ19M086NEST: {
    label: "Inflación Eurozona (IPCA)",
    unit: "índice 2015 = 100",
    description: "Índice de Precios de Consumo Armonizado (IPCA) para la zona euro.",
    yoy: true,
  },
  ECBMRRFR: {
    label: "Tipo de interés del BCE",
    unit: "%",
    description: "Tipo de interés de las operaciones principales de financiación del Banco Central Europeo.",
  },
  ECBDFR: {
    label: "Facilidad de depósito del BCE",
    unit: "%",
    description: "Tipo de la facilidad de depósito del Banco Central Europeo.",
  },
  EZ_UNRATE: {
    label: "Tasa de paro Eurozona",
    unit: "%",
    description: "Tasa de desempleo desestacionalizada de la zona euro (Eurostat).",
  },
};

/**
 * Parsea el CSV de fredgraph.
 *
 * Formato actual: `observation_date,SERIES`. Las series antiguas usan `DATE`.
 * FRED marca los datos ausentes con un punto, que hay que descartar en lugar de
 * convertirlo en cero.
 */
export function parseFredCsv(csv: string): FredPoint[] {
  const lineas = csv.trim().split(/\r?\n/);
  if (lineas.length < 2) return [];
  const puntos: FredPoint[] = [];
  for (const linea of lineas.slice(1)) {
    const [date, bruto] = linea.split(",");
    if (!date || bruto === undefined) continue;
    const limpio = bruto.trim();
    if (limpio === "." || limpio === "") continue;
    const value = Number.parseFloat(limpio);
    if (Number.isFinite(value)) puntos.push({ date: date.trim(), value });
  }
  return puntos;
}

/**
 * Parsea la respuesta JSON-stat de Eurostat (une_rt_m).
 */
export function parseEurostatUnemploymentJson(json: {
  dimension?: { time?: { category?: { index?: Record<string, number> } } };
  value?: Record<string, number>;
}): FredPoint[] {
  const index = json?.dimension?.time?.category?.index;
  const values = json?.value;
  if (!index || !values) return [];
  const dates = Object.keys(index).sort();
  const points: FredPoint[] = [];
  for (const dateKey of dates) {
    const idx = index[dateKey];
    const val = values[idx];
    if (val !== undefined && Number.isFinite(val)) {
      points.push({
        date: dateKey.includes("-") && dateKey.length === 7 ? `${dateKey}-01` : dateKey,
        value: val,
      });
    }
  }
  return points;
}

/** Variación interanual. Las series mensuales usan 12 periodos. */
export function yoyChange(puntos: FredPoint[], periodos = 12): FredPoint[] {
  const salida: FredPoint[] = [];
  for (let i = periodos; i < puntos.length; i++) {
    const previo = puntos[i - periodos].value;
    if (previo === 0) continue;
    salida.push({
      date: puntos[i].date,
      value: ((puntos[i].value - previo) / Math.abs(previo)) * 100,
    });
  }
  return salida;
}

/**
 * Obtiene la serie de desempleo de la Eurozona desde la API pública de Eurostat.
 */
export async function getEurostatUnemploymentSeries(): Promise<FredPoint[]> {
  const cache = getCacheStore();
  const cacheKey = "eurostat:une_rt_m:EA21";
  const cached = await cache.get<FredPoint[]>(cacheKey);
  if (cached) return cached;

  const geos = ["EA21", "EA20", "EU27_2020"];
  let puntos: FredPoint[] = [];

  for (const geo of geos) {
    try {
      const url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/une_rt_m?s_adj=SA&age=TOTAL&unit=PC_ACT&sex=T&geo=${geo}`;
      const res = await fetchWithTimeout(url, { cache: "no-store" }, 8000);
      if (res.ok) {
        const json = await res.json();
        const parsed = parseEurostatUnemploymentJson(json);
        if (parsed.length > 0) {
          puntos = parsed;
          break;
        }
      }
    } catch {
      // Intenta siguiente código si falla la llamada
    }
  }

  if (puntos.length === 0) {
    throw new Error("No se pudo obtener la serie de desempleo de la Eurozona desde Eurostat.");
  }

  await cache.set(cacheKey, puntos, TTL.macro);
  return puntos;
}

/**
 * Descarga una serie macroeconómica de FRED o Eurostat.
 *
 * Para FRED se usa el CSV público de fredgraph. Si existe FRED_API_KEY
 * conmuta al API JSON oficial. Para el desempleo de la Eurozona consulta Eurostat.
 */
export async function getFredSeries(id: FredSeriesId): Promise<FredPoint[]> {
  if (id === "EZ_UNRATE") {
    return getEurostatUnemploymentSeries();
  }

  const cache = getCacheStore();
  const cacheKey = `fred:${id}`;
  const cached = await cache.get<FredPoint[]>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.FRED_API_KEY?.trim();
  let puntos: FredPoint[];

  if (apiKey) {
    const url =
      `https://api.stlouisfed.org/fred/series/observations?series_id=${id}` +
      `&api_key=${encodeURIComponent(apiKey)}&file_type=json`;
    const res = await fetchWithTimeout(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`FRED devolvió ${res.status} para ${id}.`);
    const json = (await res.json()) as { observations: { date: string; value: string }[] };
    puntos = json.observations
      .filter((o) => o.value !== "." && o.value !== "")
      .map((o) => ({ date: o.date, value: Number.parseFloat(o.value) }))
      .filter((p) => Number.isFinite(p.value));
  } else {
    const res = await fetchWithTimeout(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`FRED devolvió ${res.status} para ${id}.`);
    puntos = parseFredCsv(await res.text());
  }

  await cache.set(cacheKey, puntos, TTL.macro);
  return puntos;
}

export const getMacroSeries = getFredSeries;
