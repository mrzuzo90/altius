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
    // El cierre AJUSTADO manda sobre el crudo. El crudo no incorpora splits, y
    // eso no es un matiz: la semana del split 10:1 de NVIDIA de junio de 2024,
    // el cierre crudo pasa de 1.208,88 a 120,68 dólares. Dibujado sin ajustar,
    // el gráfico muestra un desplome del noventa por ciento que nunca ocurrió,
    // y deja a NVIDIA cotizando por debajo de su precio de 2021 cuando en
    // realidad se ha multiplicado por doce.
    const bruto = campos["5. adjusted close"] ?? campos["4. close"];
    const close = Number.parseFloat(bruto ?? "");
    if (Number.isFinite(close)) points.push({ date, close });
  }
  points.sort((a, b) => (a.date < b.date ? -1 : 1));
  return points.length > 0
    ? { ok: true, points }
    : { ok: false, reason: "error", message: "Ninguna observación era numérica." };
}
