import { getCacheStore, TTL } from "@/lib/cache/store";

export type FredPoint = { date: string; value: number };

export type FredSeriesId = "CPIAUCSL" | "FEDFUNDS" | "UNRATE";

export const FRED_SERIES: Record<
  FredSeriesId,
  { label: string; unit: string; description: string; yoy?: boolean }
> = {
  CPIAUCSL: {
    label: "Inflación (IPC)",
    unit: "índice 1982-84 = 100",
    description: "Índice de precios al consumo para consumidores urbanos, desestacionalizado.",
    yoy: true,
  },
  FEDFUNDS: {
    label: "Tipo de interés de la Fed",
    unit: "%",
    description: "Tipo efectivo de los fondos federales, media mensual.",
  },
  UNRATE: {
    label: "Desempleo",
    unit: "%",
    description: "Tasa de paro civil, desestacionalizada.",
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

/** Variación interanual. Las series de FRED son mensuales, así que 12 posiciones. */
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
 * Descarga una serie de FRED.
 *
 * Se usa el CSV público de fredgraph, que no exige registro. Si existe
 * FRED_API_KEY se conmuta al API JSON oficial, que da los mismos datos.
 */
export async function getFredSeries(id: FredSeriesId): Promise<FredPoint[]> {
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
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`FRED devolvió ${res.status} para ${id}.`);
    const json = (await res.json()) as { observations: { date: string; value: string }[] };
    puntos = json.observations
      .filter((o) => o.value !== "." && o.value !== "")
      .map((o) => ({ date: o.date, value: Number.parseFloat(o.value) }))
      .filter((p) => Number.isFinite(p.value));
  } else {
    const res = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`FRED devolvió ${res.status} para ${id}.`);
    puntos = parseFredCsv(await res.text());
  }

  await cache.set(cacheKey, puntos, TTL.macro);
  return puntos;
}
