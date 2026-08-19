export type PricePoint = { date: string; close: number };

export type PriceSeries = {
  ticker: string;
  points: PricePoint[];
  /** Proveedor del que procede la serie, para mostrarlo en la interfaz. */
  source: string;
};

/** Motivo por el que no hay serie. Se muestra al usuario tal cual, sin adornos. */
export type PriceUnavailable =
  | { reason: "no-provider" }
  | { reason: "rate-limited"; message: string }
  | { reason: "not-found"; ticker: string }
  | { reason: "error"; message: string };

export type PriceResult = { ok: true; series: PriceSeries } | { ok: false } & PriceUnavailable;
