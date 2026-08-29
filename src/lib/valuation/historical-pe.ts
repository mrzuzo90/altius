import type { PricePoint, PriceSeries } from "@/lib/prices";
import type { Cell, LineSeries, Period } from "@/lib/sec/normalize";
import type { StatementBundle } from "@/lib/sec/statements";

export type HistoricalPePoint = {
  fiscalYear: number;
  label: string;
  periodEnd: string;
  earningsKnownAt: string;
  priceDate: string | null;
  price: number | null;
  eps: number | null;
  pe: number | null;
  status: "available" | "loss" | "missing";
};

export type HistoricalPeSeries = {
  points: HistoricalPePoint[];
  currentPe: number | null;
  currentPrice: number | null;
  latestEps: number | null;
  median10Y: number | null;
  median20Y: number | null;
  medianAll: number | null;
  premiumToMedian10Y: number | null;
  premiumToMedian20Y: number | null;
  observations20Y: number;
  startFiscalYear20Y: number | null;
  endFiscalYear20Y: number | null;
  comparableCurrency: boolean;
  reason: string | null;
};

function reportedAt(cell: Cell | undefined, period: Period): string {
  if (cell?.provenance.kind === "reported") return cell.provenance.filed;
  return period.end;
}

function priceAtOrBefore(points: PricePoint[], date: string): PricePoint | null {
  let candidate: PricePoint | null = null;
  for (const point of points) {
    if (point.date > date) break;
    candidate = point;
  }
  return candidate;
}

export function median(values: number[]): number | null {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function rowValue(row: LineSeries | undefined, key: string): number | null {
  return row?.cells[key]?.value ?? null;
}

function firstValue(row: LineSeries | undefined, key: string): number | null {
  return row?.cells[key]?.firstReported?.value ?? rowValue(row, key);
}

function firstFiled(row: LineSeries | undefined, key: string): string | null {
  return row?.cells[key]?.firstReported?.filed ?? null;
}

export function adjustPerShareValueForSplits(
  value: number,
  knownAt: string,
  splits: NonNullable<PriceSeries["splits"]>,
): number {
  return splits
    .filter((split) => split.date > knownAt && split.numerator > 0 && split.denominator > 0)
    .reduce((adjusted, split) => adjusted * (split.denominator / split.numerator), value);
}

export function buildHistoricalPeSeries(
  bundle: StatementBundle,
  prices: PriceSeries | null,
  statementCurrency = "USD",
): HistoricalPeSeries {
  const income = bundle.blocks.find((block) => block.id === "income");
  const epsRow = income?.rows.find((row) => row.line.id === "epsDiluted");
  const basicEpsRow = income?.rows.find((row) => row.line.id === "epsBasic");
  const netIncomeRow = income?.rows.find((row) => row.line.id === "netIncome");
  const sharesRow = income?.rows.find((row) => row.line.id === "sharesDiluted");
  const pricePoints = prices?.points ?? [];
  const comparableCurrency = !prices?.currency || prices.currency === statementCurrency;

  const points = [...(income?.periods ?? [])].reverse().map((period): HistoricalPePoint => {
    const dilutedEps = firstValue(epsRow, period.key);
    const basicEps = firstValue(basicEpsRow, period.key);
    const reportedEps = dilutedEps ?? basicEps;
    const netIncome = firstValue(netIncomeRow, period.key);
    const shares = firstValue(sharesRow, period.key);
    const rawEps = reportedEps ?? (netIncome !== null && shares !== null && shares > 0 ? netIncome / shares : null);
    const directFiled = dilutedEps !== null
      ? firstFiled(epsRow, period.key)
      : basicEps !== null
        ? firstFiled(basicEpsRow, period.key)
        : null;
    const fallbackFiled = [firstFiled(netIncomeRow, period.key), firstFiled(sharesRow, period.key)]
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;
    const epsCell = dilutedEps !== null ? epsRow?.cells[period.key] : basicEpsRow?.cells[period.key];
    const earningsKnownAt = directFiled ?? fallbackFiled ?? reportedAt(epsCell, period);
    const eps = rawEps === null
      ? null
      : adjustPerShareValueForSplits(rawEps, earningsKnownAt, prices?.splits ?? []);
    const marketPoint = comparableCurrency ? priceAtOrBefore(pricePoints, earningsKnownAt) : null;
    const pe = marketPoint && eps !== null && eps > 0 ? marketPoint.close / eps : null;

    return {
      fiscalYear: period.fiscalYear,
      label: `FY ${period.fiscalYear}`,
      periodEnd: period.end,
      earningsKnownAt,
      priceDate: marketPoint?.date ?? null,
      price: marketPoint?.close ?? null,
      eps,
      pe,
      status: eps !== null && eps <= 0 ? "loss" : pe !== null ? "available" : "missing",
    };
  });

  const valid = points.flatMap((point) => point.pe !== null ? [point.pe] : []);
  const lastTen = points.slice(-10).flatMap((point) => point.pe !== null ? [point.pe] : []);
  const latestFiscalYear = points.at(-1)?.fiscalYear ?? null;
  const lastTwentyPoints = latestFiscalYear === null
    ? []
    : points.filter((point) => point.fiscalYear >= latestFiscalYear - 19 && point.fiscalYear <= latestFiscalYear);
  const lastTwenty = lastTwentyPoints.flatMap((point) => point.pe !== null ? [point.pe] : []);
  const median10Y = median(lastTen);
  const median20Y = lastTwenty.length >= 3 ? median(lastTwenty) : null;
  const medianAll = median(valid);
  // Para el PER actual sí interesa la última cifra reexpresada. El valor
  // point-in-time (primera presentación) se reserva al histórico para evitar
  // sesgo retrospectivo.
  const latestPeriod = income?.periods[0];
  const latestDiluted = latestPeriod ? rowValue(epsRow, latestPeriod.key) : null;
  const latestBasic = latestPeriod ? rowValue(basicEpsRow, latestPeriod.key) : null;
  const latestNetIncome = latestPeriod ? rowValue(netIncomeRow, latestPeriod.key) : null;
  const latestShares = latestPeriod ? rowValue(sharesRow, latestPeriod.key) : null;
  const latestRawEps = latestDiluted ?? latestBasic ?? (
    latestNetIncome !== null && latestShares !== null && latestShares > 0
      ? latestNetIncome / latestShares
      : null
  );
  const latestCell = latestPeriod
    ? latestDiluted !== null
      ? epsRow?.cells[latestPeriod.key]
      : basicEpsRow?.cells[latestPeriod.key]
    : undefined;
  const latestKnownAt = latestPeriod ? reportedAt(latestCell, latestPeriod) : null;
  const latestEps = latestRawEps !== null && latestKnownAt
    ? adjustPerShareValueForSplits(latestRawEps, latestKnownAt, prices?.splits ?? [])
    : null;
  const currentPrice = comparableCurrency ? pricePoints.at(-1)?.close ?? null : null;
  const currentPe = latestEps !== null && latestEps > 0 && currentPrice !== null
    ? currentPrice / latestEps
    : null;
  const premiumToMedian10Y = currentPe !== null && median10Y !== null && median10Y > 0
    ? ((currentPe / median10Y) - 1) * 100
    : null;
  const premiumToMedian20Y = currentPe !== null && median20Y !== null && median20Y > 0
    ? ((currentPe / median20Y) - 1) * 100
    : null;
  const observedTwentyYears = lastTwentyPoints.filter((point) => point.pe !== null).map((point) => point.fiscalYear);

  return {
    points,
    currentPe,
    currentPrice,
    latestEps,
    median10Y,
    median20Y,
    medianAll,
    premiumToMedian10Y,
    premiumToMedian20Y,
    observations20Y: lastTwenty.length,
    startFiscalYear20Y: observedTwentyYears[0] ?? null,
    endFiscalYear20Y: observedTwentyYears.at(-1) ?? null,
    comparableCurrency,
    reason: !comparableCurrency
      ? `La cotización está en ${prices?.currency ?? "otra divisa"} y el BPA en ${statementCurrency}; no se mezclan sin tipo de cambio.`
      : pricePoints.length === 0
        ? "No se ha podido obtener o convertir la cotización histórica para esta empresa."
      : points.length === 0
        ? "No hay ejercicios anuales suficientes para calcular el histórico."
        : valid.length === 0
          ? "Hay estados y cotización, pero falta BPA por acción utilizable para construir el PER histórico."
        : null,
  };
}
