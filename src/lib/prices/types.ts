export type PricePoint = { date: string; close: number };

export type SplitEvent = {
  date: string;
  numerator: number;
  denominator: number;
};

export type PriceSeries = {
  ticker: string;
  points: PricePoint[];
  /** Divisa declarada por el mercado. Es imprescindible para no mezclar precio y BPA. */
  currency: string | null;
  /** Eventos necesarios para poner el BPA histórico en la misma base por acción que Yahoo. */
  splits?: SplitEvent[];
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
