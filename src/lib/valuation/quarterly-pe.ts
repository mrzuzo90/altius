import type { PricePoint, PriceSeries } from "@/lib/prices";
import type { Cell, LineSeries, Period } from "@/lib/sec/normalize";
import type { StatementBundle } from "@/lib/sec/statements";
import { adjustPerShareValueForSplits, median } from "./historical-pe";

export type QuarterlyPePoint = {
  periodKey: string;
  fiscalYear: number;
  quarter: number;
  label: string;
  periodEnd: string;
  earningsKnownAt: string;
  priceDate: string | null;
  price: number | null;
  /** BPA de los cuatro trimestres conocidos en la fecha del evento. */
  eps: number | null;
  pe: number | null;
  status: "available" | "loss" | "missing";
};

export type QuarterlyPeSeries = {
  points: QuarterlyPePoint[];
  lastPe: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  comparableCurrency: boolean;
  reason: string | null;
};

type QuarterObservation = { eps: number | null; knownAt: string };

function priceAtOrBefore(points: PricePoint[], date: string): PricePoint | null {
  let candidate: PricePoint | null = null;
  for (const point of points) {
    if (point.date > date) break;
    candidate = point;
  }
  return candidate;
}

function pointInTimeValue(row: LineSeries | undefined, key: string): number | null {
  const cell = row?.cells[key];
  return cell?.firstReported?.value ?? cell?.value ?? null;
}

function knownAt(cell: Cell | undefined, period: Period): string {
  if (cell?.firstReported?.filed) return cell.firstReported.filed;
  if (cell?.provenance.kind === "reported") return cell.provenance.filed;
  return period.end;
}

function observationFor(
  period: Period,
  epsDiluted: LineSeries | undefined,
  epsBasic: LineSeries | undefined,
  netIncome: LineSeries | undefined,
  sharesDiluted: LineSeries | undefined,
): QuarterObservation {
  const diluted = pointInTimeValue(epsDiluted, period.key);
  const basic = pointInTimeValue(epsBasic, period.key);
  const income = pointInTimeValue(netIncome, period.key);
  const shares = pointInTimeValue(sharesDiluted, period.key);
  const eps = diluted ?? basic ?? (
    income !== null && shares !== null && shares > 0 ? income / shares : null
  );
  const directCell = diluted !== null
    ? epsDiluted?.cells[period.key]
    : basic !== null
      ? epsBasic?.cells[period.key]
      : undefined;
  const fallbackDates = [
    netIncome?.cells[period.key]?.firstReported?.filed,
    sharesDiluted?.cells[period.key]?.firstReported?.filed,
  ].filter((value): value is string => Boolean(value));
  return {
    eps,
    knownAt: directCell
      ? knownAt(directCell, period)
      : fallbackDates.sort().at(-1) ?? period.end,
  };
}

/**
 * Calcula un PER TTM en cada presentación trimestral. Solo utiliza los cuatro
 * trimestres y la cotización que ya se conocían en esa fecha.
 */
export function buildQuarterlyPeSeries(
  bundle: StatementBundle | null,
  prices: PriceSeries | null,
  statementCurrency = "USD",
): QuarterlyPeSeries {
  const income = bundle?.blocks.find((block) => block.id === "income");
  const periods = [...(income?.periods ?? [])].sort((a, b) => a.end.localeCompare(b.end));
  const epsDiluted = income?.rows.find((row) => row.line.id === "epsDiluted");
  const epsBasic = income?.rows.find((row) => row.line.id === "epsBasic");
  const netIncome = income?.rows.find((row) => row.line.id === "netIncome");
  const sharesDiluted = income?.rows.find((row) => row.line.id === "sharesDiluted");
  const pricePoints = prices?.points ?? [];
  const comparableCurrency = !prices?.currency || prices.currency === statementCurrency;
  const observations = periods.map((period) => observationFor(
    period,
    epsDiluted,
    epsBasic,
    netIncome,
    sharesDiluted,
  ));

  const points = periods.map((period, index): QuarterlyPePoint => {
    const observation = observations[index];
    const window = observations.slice(Math.max(0, index - 3), index + 1);
    const completeWindow = window.length === 4 && window.every((item) => item.eps !== null);
    const eps = completeWindow
      ? window.reduce((sum, item) => sum + adjustPerShareValueForSplits(
          item.eps!,
          item.knownAt,
          prices?.splits ?? [],
        ), 0)
      : null;
    const marketPoint = comparableCurrency
      ? priceAtOrBefore(pricePoints, observation.knownAt)
      : null;
    const pe = marketPoint && eps !== null && eps > 0 ? marketPoint.close / eps : null;
    return {
      periodKey: period.key,
      fiscalYear: period.fiscalYear,
      quarter: period.quarter,
      label: `Q${period.quarter} FY ${period.fiscalYear}`,
      periodEnd: period.end,
      earningsKnownAt: observation.knownAt,
      priceDate: marketPoint?.date ?? null,
      price: marketPoint?.close ?? null,
      eps,
      pe,
      status: eps !== null && eps <= 0 ? "loss" : pe !== null ? "available" : "missing",
    };
  });

  const valid = points.flatMap((point) => point.pe !== null ? [point.pe] : []);
  return {
    points,
    lastPe: [...points].reverse().find((point) => point.pe !== null)?.pe ?? null,
    median: median(valid),
    min: valid.length > 0 ? Math.min(...valid) : null,
    max: valid.length > 0 ? Math.max(...valid) : null,
    comparableCurrency,
    reason: !bundle || periods.length === 0
      ? "Este emisor no publica resultados trimestrales estructurados en la fuente regulatoria disponible."
      : !comparableCurrency
        ? `La cotización está en ${prices?.currency ?? "otra divisa"} y los resultados en ${statementCurrency}.`
        : pricePoints.length === 0
          ? "No hay cotización histórica utilizable para las fechas de presentación."
          : valid.length === 0
            ? "Faltan cuatro trimestres consecutivos de BPA para calcular un PER TTM."
            : null,
  };
}
