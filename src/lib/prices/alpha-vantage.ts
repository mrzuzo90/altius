import type { PricePoint } from "./types";

/**
 * Respuestas de Alpha Vantage.
 *
 * El API devuelve HTTP 200 incluso cuando rechaza la petición: el motivo llega
 * en las claves `Note`, `Information` o `Error Message`. Comprobar solo el
 * código de estado da falsos positivos.
 */
export type AlphaVantagePayload = Record<string, unknown> & {
  Note?: string;
  Information?: string;
  "Error Message"?: string;
};

export type ParseResult =
  | { ok: true; points: PricePoint[] }
  | { ok: false; reason: "rate-limited" | "not-found" | "error"; message: string };

/** La clave de la serie varía según el endpoint: diaria, semanal o mensual. */
function localizarSerie(payload: AlphaVantagePayload): Record<string, Record<string, string>> | null {
  for (const [clave, valor] of Object.entries(payload)) {
    if (clave === "Meta Data") continue;
    if (/time series/i.test(clave) && valor && typeof valor === "object") {
      return valor as Record<string, Record<string, string>>;
    }
  }
  return null;
}

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

  const serie = localizarSerie(payload);
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
