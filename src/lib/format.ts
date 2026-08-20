import type { LineUnit } from "@/lib/sec/taxonomy";

export type Scale = "millions" | "thousands" | "billions";

export const SCALES: Record<Scale, { divisor: number; label: string }> = {
  thousands: { divisor: 1e3, label: "miles" },
  millions: { divisor: 1e6, label: "millones" },
  billions: { divisor: 1e9, label: "miles de millones" },
};

const es = (min: number, max: number) =>
  new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
    // Sin esto, es-ES deja "1234" sin punto de millar y rompe la alineación.
    useGrouping: "always",
  });

/**
 * Formatea una celda financiera.
 *
 * Los negativos van entre paréntesis, que es la convención de los estados
 * financieros. Un valor ausente se muestra como raya: nunca como cero, porque
 * "no lo reportan" y "vale cero" son cosas distintas.
 */
export function formatValue(
  value: number | null | undefined,
  unit: LineUnit,
  scale: Scale = "millions",
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";

  if (unit === "percent") {
    const t = es(1, 2).format(Math.abs(value));
    return value < 0 ? `(${t} %)` : `${t} %`;
  }

  if (unit === "USD/shares" || unit === "pure") {
    const t = es(2, 2).format(Math.abs(value));
    return value < 0 ? `(${t})` : t;
  }

  const escalado = value / SCALES[scale].divisor;
  // Por debajo de la unidad de escala, cero decimales convertiría todo en "0".
  const decimales = Math.abs(escalado) < 10 && escalado !== 0 ? 2 : 0;
  const t = es(decimales, decimales).format(Math.abs(escalado));
  return value < 0 ? `(${t})` : t;
}

/** Variación porcentual entre dos periodos. Null si no es calculable. */
export function pctChange(actual: number | null, previo: number | null): number | null {
  if (actual === null || previo === null || previo === 0) return null;
  return ((actual - previo) / Math.abs(previo)) * 100;
}

export function formatPct(v: number | null, decimales = 1): string {
  if (v === null || !Number.isFinite(v)) return "—";
  return `${v >= 0 ? "+" : "−"}${es(decimales, decimales).format(Math.abs(v))} %`;
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeZone: "UTC" }).format(d);
}
