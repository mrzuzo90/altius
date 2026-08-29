import type { PricePoint } from "./types";

export type PriceRangeId =
  | "1m"
  | "3m"
  | "6m"
  | "ytd"
  | "fytd"
  | "1y"
  | "3y"
  | "5y"
  | "10y"
  | "max"
  | "custom";

const CALENDAR_OFFSETS: Partial<Record<PriceRangeId, { months?: number; years?: number }>> = {
  "1m": { months: 1 },
  "3m": { months: 3 },
  "6m": { months: 6 },
  "1y": { years: 1 },
  "3y": { years: 3 },
  "5y": { years: 5 },
  "10y": { years: 10 },
};

function subtractCalendarOffset(
  date: string,
  offset: { months?: number; years?: number },
): string {
  const source = new Date(`${date}T00:00:00Z`);
  const originalDay = source.getUTCDate();
  const targetMonth = source.getUTCMonth() - (offset.months ?? 0);
  const targetYear = source.getUTCFullYear() - (offset.years ?? 0);
  const target = new Date(Date.UTC(targetYear, targetMonth, 1));
  const lastDayOfTargetMonth = new Date(Date.UTC(
    target.getUTCFullYear(),
    target.getUTCMonth() + 1,
    0,
  )).getUTCDate();
  target.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));
  return target.toISOString().slice(0, 10);
}

export function priceRangeCutoff(lastDate: string, range: PriceRangeId): string {
  const calendarYearStart = `${lastDate.slice(0, 4)}-01-01`;
  if (range === "ytd") return calendarYearStart;
  const offset = CALENDAR_OFFSETS[range];
  return offset ? subtractCalendarOffset(lastDate, offset) : lastDate;
}

/** Selecciona observaciones por fecha; nunca por cantidad de puntos. */
export function filterPricePoints<T extends PricePoint>(
  points: T[],
  range: PriceRangeId,
  options: { from?: string; to?: string; fiscalYearStart?: string | null } = {},
): T[] {
  if (points.length === 0 || range === "max") return points;
  if (range === "custom") {
    return points.filter((point) =>
      (!options.from || point.date >= options.from) &&
      (!options.to || point.date <= options.to),
    );
  }

  const lastDate = points.at(-1)!.date;
  const cutoff = range === "ytd"
    ? priceRangeCutoff(lastDate, range)
    : range === "fytd"
      ? options.fiscalYearStart && options.fiscalYearStart <= lastDate
        ? options.fiscalYearStart
        : priceRangeCutoff(lastDate, "ytd")
      : priceRangeCutoff(lastDate, range);

  const selected = points.filter((point) => point.date >= cutoff);
  const baseline = points.findLast((point) => point.date < cutoff);
  if (!baseline) return selected;

  // Para calcular la variación se usa el último cierre anterior al inicio del
  // periodo (fin de semana/festivo). Si hay un hueco grande, no se inventa una
  // base que en realidad pertenezca a otro periodo.
  const gapDays = (Date.parse(cutoff) - Date.parse(baseline.date)) / 86_400_000;
  return gapDays <= 35 ? [baseline, ...selected] : selected;
}
