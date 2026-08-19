import type { PricePoint } from "./types";

/**
 * Respuestas de Alpha Vantage.
 *
 * El API devuelve HTTP 200 incluso cuando rechaza la petición: el motivo llega
 * en las claves `Note`, `Information` o `Error Message`. Comprobar solo el
 * código de estado da falsos positivos.
 */
export type AlphaVantagePayload = {
  "Time Series (Daily)"?: Record<string, Record<string, string>>;
  Note?: string;
  Information?: string;
  "Error Message"?: string;
};

export type ParseResult =
  | { ok: true; points: PricePoint[] }
  | { ok: false; reason: "rate-limited" | "not-found" | "error"; message: string };

export function parseAlphaVantage(payload: AlphaVantagePayload): ParseResult {
  if (payload.Note || payload.Information) {
    return {
      ok: false,
      reason: "rate-limited",
      message: (payload.Note ?? payload.Information)!,
    };
  }
  if (payload["Error Message"]) {
    return { ok: false, reason: "not-found", message: payload["Error Message"] };
  }

  const serie = payload["Time Series (Daily)"];
  if (!serie || Object.keys(serie).length === 0) {
    return { ok: false, reason: "error", message: "La respuesta no contenía serie temporal." };
  }

  const points: PricePoint[] = [];
  for (const [date, campos] of Object.entries(serie)) {
    const bruto = campos["4. close"] ?? campos["5. adjusted close"];
    const close = Number.parseFloat(bruto ?? "");
    if (Number.isFinite(close)) points.push({ date, close });
  }
  points.sort((a, b) => (a.date < b.date ? -1 : 1));
  return points.length > 0
    ? { ok: true, points }
    : { ok: false, reason: "error", message: "Ninguna observación era numérica." };
}
