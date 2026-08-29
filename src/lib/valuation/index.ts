import type { StatementBundle } from "../sec/statements";
import type { NormalizedStatement, PeriodKey } from "../sec/normalize";
import type {
  HistoricalMetricCoverage,
  ImpliedExpectations,
  ValuationMetrics,
  ProjectionInputs,
  ValuationProjection,
  ProjectedYear,
} from "./types";

type HistoricalObservation = { fiscalYear: number; value: number };

function getLatestValue(statement: NormalizedStatement | undefined, lineId: string, periodKey: PeriodKey): number | null {
  if (!statement) return null;
  const row = statement.rows.find((r) => r.line.id === lineId);
  if (!row) return null;
  return row.cells[periodKey]?.value ?? null;
}

function getPeriodValue(statement: NormalizedStatement | undefined, lineId: string, periodKey: PeriodKey): number | null {
  return getLatestValue(statement, lineId, periodKey);
}

function sumReported(values: Array<number | null>): number | null {
  const reported = values.filter((value): value is number => value !== null && Number.isFinite(value));
  return reported.length > 0 ? reported.reduce((sum, value) => sum + value, 0) : null;
}

function mostCompleteTotal(reportedTotal: number | null, componentTotal: number | null): number | null {
  if (reportedTotal === null) return componentTotal;
  if (componentTotal === null) return reportedTotal;
  return Math.max(reportedTotal, componentTotal);
}

function median(values: readonly number[]): number | null {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function summarizeHistory(observations: readonly HistoricalObservation[]): {
  value: number | null;
  coverage: HistoricalMetricCoverage;
} {
  const ordered = [...observations].filter((observation) => Number.isFinite(observation.value));
  const years = ordered.map((observation) => observation.fiscalYear).sort((a, b) => a - b);
  return {
    value: ordered.length >= 3 ? median(ordered.map((observation) => observation.value)) : null,
    coverage: {
      observations: ordered.length,
      startFiscalYear: years[0] ?? null,
      endFiscalYear: years.at(-1) ?? null,
    },
  };
}

function buildTwentyYearReferences(income: NormalizedStatement | undefined) {
  const periods = [...(income?.periods ?? [])].sort((a, b) => a.fiscalYear - b.fiscalYear);
  const latestYear = periods.at(-1)?.fiscalYear ?? null;
  const windowStart = latestYear === null ? null : latestYear - 19;
  const referencePeriods = windowStart === null
    ? []
    : periods.filter((period) => period.fiscalYear >= windowStart && period.fiscalYear <= latestYear!);

  const ebitMargins = referencePeriods.flatMap((period): HistoricalObservation[] => {
    const revenue = getPeriodValue(income, "revenue", period.key);
    const ebit = getPeriodValue(income, "operatingIncome", period.key);
    return revenue !== null && revenue > 0 && ebit !== null
      ? [{ fiscalYear: period.fiscalYear, value: (ebit / revenue) * 100 }]
      : [];
  });

  const taxRates = referencePeriods.flatMap((period): HistoricalObservation[] => {
    const pretaxIncome = getPeriodValue(income, "pretaxIncome", period.key);
    const incomeTax = getPeriodValue(income, "incomeTax", period.key);
    if (pretaxIncome === null || pretaxIncome <= 0 || incomeTax === null) return [];
    const rate = (incomeTax / pretaxIncome) * 100;
    return rate >= 0 && rate <= 100
      ? [{ fiscalYear: period.fiscalYear, value: rate }]
      : [];
  });

  const revenueGrowth: HistoricalObservation[] = [];
  for (let index = 1; index < periods.length; index += 1) {
    const previous = periods[index - 1];
    const current = periods[index];
    if (windowStart === null || current.fiscalYear < windowStart || current.fiscalYear > latestYear!) continue;
    const previousRevenue = getPeriodValue(income, "revenue", previous.key);
    const currentRevenue = getPeriodValue(income, "revenue", current.key);
    const elapsedYears = current.fiscalYear - previous.fiscalYear;
    if (previousRevenue === null || previousRevenue <= 0 || currentRevenue === null || currentRevenue <= 0 || elapsedYears <= 0) continue;
    revenueGrowth.push({
      fiscalYear: current.fiscalYear,
      value: (Math.pow(currentRevenue / previousRevenue, 1 / elapsedYears) - 1) * 100,
    });
  }

  return {
    ebitMargin: summarizeHistory(ebitMargins),
    taxRate: summarizeHistory(taxRates),
    revenueGrowth: summarizeHistory(revenueGrowth),
  };
}

export function buildValuationMetrics(
  bundle: StatementBundle,
  price: number | null,
  priceDate: string | null = null,
): ValuationMetrics {
  const income = bundle.blocks.find((b) => b.id === "income");
  const balance = bundle.blocks.find((b) => b.id === "balance");
  const cashflow = bundle.blocks.find((b) => b.id === "cashflow");

  const latestPeriod = income?.periods[0] ?? balance?.periods[0] ?? cashflow?.periods[0];
  const pKey = latestPeriod?.key ?? "";
  const lastFiscalYear = latestPeriod?.fiscalYear ?? null;
  const twentyYear = buildTwentyYearReferences(income);

  const revenue = getLatestValue(income, "revenue", pKey);
  const operatingIncome = getLatestValue(income, "operatingIncome", pKey);
  const netIncome = getLatestValue(income, "netIncome", pKey);
  const reportedSharesDiluted = getLatestValue(income, "sharesDiluted", pKey);
  const sharesOutstanding = getLatestValue(balance, "sharesOutstanding", pKey);
  const eps = getLatestValue(income, "epsDiluted", pKey) ?? getLatestValue(income, "epsBasic", pKey);
  const sharesDiluted = reportedSharesDiluted ?? (
    netIncome !== null && netIncome > 0 && eps !== null && eps > 0
      ? netIncome / eps
      : null
  );

  const depreciation = getLatestValue(cashflow, "depreciation", pKey);
  const freeCashFlow = getLatestValue(cashflow, "freeCashFlow", pKey);

  const cash = getLatestValue(balance, "cash", pKey);
  const shortTermInvestments = getLatestValue(balance, "shortTermInvestments", pKey);
  const longTermDebt = getLatestValue(balance, "longTermDebt", pKey);
  const shortTermDebt = getLatestValue(balance, "shortTermDebt", pKey);
  const reportedCashAndInvestments = getLatestValue(balance, "cashAndShortTermInvestments", pKey);
  const reportedTotalDebt = getLatestValue(balance, "totalDebt", pKey);
  const reportedNetDebt = getLatestValue(balance, "netDebt", pKey);

  const totalCash = mostCompleteTotal(reportedCashAndInvestments, sumReported([cash, shortTermInvestments]));
  const totalDebt = mostCompleteTotal(reportedTotalDebt, sumReported([longTermDebt, shortTermDebt]));

  const netDebt = reportedNetDebt ?? ((totalDebt !== null && totalCash !== null)
    ? totalDebt - totalCash
    : null);

  const ebitda = operatingIncome !== null && depreciation !== null
    ? operatingIncome + depreciation
    : null;

  const marketCapShares = sharesOutstanding ?? sharesDiluted;
  const marketCap = (marketCapShares !== null && marketCapShares > 0 && price !== null && price > 0)
    ? price * marketCapShares
    : null;

  const enterpriseValue = (marketCap !== null && netDebt !== null)
    ? marketCap + netDebt
    : null;

  // Múltiplos
  const pe = price !== null && price > 0 && eps !== null && eps > 0
    ? price / eps
    : (marketCap !== null && netIncome !== null && netIncome > 0)
      ? marketCap / netIncome
      : null;

  const evEbitda = (enterpriseValue !== null && ebitda !== null && ebitda > 0)
    ? enterpriseValue / ebitda
    : null;

  const evEbit = (enterpriseValue !== null && operatingIncome !== null && operatingIncome > 0)
    ? enterpriseValue / operatingIncome
    : null;

  const evFcf = (enterpriseValue !== null && freeCashFlow !== null && freeCashFlow > 0)
    ? enterpriseValue / freeCashFlow
    : null;

  const netDebtEbitda = (netDebt !== null && ebitda !== null && ebitda > 0)
    ? netDebt / ebitda
    : null;

  const fcfYield = (marketCap !== null && freeCashFlow !== null && marketCap > 0)
    ? (freeCashFlow / marketCap) * 100
    : null;

  // Medianas históricas de hasta 20 ejercicios / base para proyecciones.
  // Se calculan por periodo y nunca se sustituyen por el último dato disponible.
  const historicalEbitMargin = twentyYear.ebitMargin.value;
  const historicalTaxRate = twentyYear.taxRate.value;

  const historicalFcfConversion = (ebitda !== null && freeCashFlow !== null && ebitda > 0)
    ? Math.min(Math.max((freeCashFlow / ebitda) * 100, 10), 120)
    : null;

  const historicalRevenueGrowth = twentyYear.revenueGrowth.value;
  const historicalDepreciationMargin =
    revenue !== null && revenue > 0 && depreciation !== null
      ? (depreciation / revenue) * 100
      : null;

  return {
    currency: bundle.currency ?? "USD",
    price,
    priceDate,
    sharesDiluted,
    marketCap,
    totalCash,
    totalDebt,
    netDebt,
    enterpriseValue,

    revenue,
    ebit: operatingIncome,
    ebitda,
    netIncome,
    freeCashFlow,

    pe,
    evEbitda,
    evEbit,
    evFcf,
    netDebtEbitda,
    fcfYield,

    historicalRevenueGrowth,
    historicalRevenueGrowthCoverage: twentyYear.revenueGrowth.coverage,
    historicalEbitMargin,
    historicalEbitMarginCoverage: twentyYear.ebitMargin.coverage,
    historicalFcfConversion,
    historicalDepreciationMargin,
    historicalTaxRate,
    historicalTaxRateCoverage: twentyYear.taxRate.coverage,
    lastFiscalYear,
  };
}

export function calculateProjection(
  metrics: ValuationMetrics,
  inputs: ProjectionInputs,
): ValuationProjection {
  const baseRevenue = metrics.revenue && metrics.revenue > 0 ? metrics.revenue : null;
  const baseShares = metrics.sharesDiluted && metrics.sharesDiluted > 0 ? metrics.sharesDiluted : null;
  const startYear = metrics.lastFiscalYear;

  if (baseRevenue === null || baseShares === null || startYear === null) {
    return {
      years: [],
      currentPrice: metrics.price,
      targetPrice5Y: null,
      marginOfSafety: null,
      cagr5Y: null,
      unavailableReason: "Faltan ventas, acciones diluidas o ejercicio fiscal para construir la proyección.",
    };
  }

  const conversionPct = metrics.historicalFcfConversion !== null
    ? metrics.historicalFcfConversion / 100
    : null;
  const depreciationMargin = metrics.historicalDepreciationMargin !== null
    ? metrics.historicalDepreciationMargin / 100
    : null;

  const years: ProjectedYear[] = [];
  let currentRev = baseRevenue;
  let currentShares = baseShares;

  for (let i = 1; i <= 5; i++) {
    const yearNumber = startYear + i;
    const label = `${yearNumber}e`;

    currentRev = currentRev * (1 + inputs.revenueGrowth / 100);
    const ebit = currentRev * (inputs.targetEbitMargin / 100);
    const netIncome = ebit * (1 - inputs.taxRate / 100);
    const fcf = conversionPct !== null ? ebit * conversionPct : null;
    currentShares = currentShares * (1 + inputs.sharesGrowth / 100);

    let targetMarketCap: number | null = null;
    if (inputs.targetMultipleType === "PE") {
      targetMarketCap = netIncome * inputs.targetMultiple;
    } else if (inputs.targetMultipleType === "EV_FCF" && fcf !== null && metrics.netDebt !== null) {
      const targetEV = fcf * inputs.targetMultiple;
      targetMarketCap = targetEV - metrics.netDebt;
    } else if (
      inputs.targetMultipleType === "EV_EBITDA" &&
      depreciationMargin !== null &&
      metrics.netDebt !== null
    ) {
      const ebitda = ebit + currentRev * depreciationMargin;
      const targetEV = ebitda * inputs.targetMultiple;
      targetMarketCap = targetEV - metrics.netDebt;
    }

    const targetPrice = targetMarketCap !== null && currentShares > 0
      ? Math.max(targetMarketCap / currentShares, 0)
      : null;

    years.push({
      yearIndex: i,
      label,
      revenue: currentRev,
      ebit,
      netIncome,
      fcf,
      sharesDiluted: currentShares,
      targetMarketCap,
      targetPrice,
    });
  }

  const targetPrice5Y = years[4]?.targetPrice ?? null;
  const currentPrice = metrics.price !== null && metrics.price > 0 ? metrics.price : null;

  const marginOfSafety = targetPrice5Y !== null && currentPrice !== null
    ? ((targetPrice5Y - currentPrice) / currentPrice) * 100
    : null;
  const cagr5Y =
    targetPrice5Y !== null && targetPrice5Y > 0 && currentPrice !== null
      ? (Math.pow(targetPrice5Y / currentPrice, 1 / 5) - 1) * 100
      : null;

  return {
    years,
    currentPrice,
    targetPrice5Y,
    marginOfSafety,
    cagr5Y,
    unavailableReason: targetPrice5Y === null
      ? "El múltiplo elegido requiere datos históricos que la empresa no ha reportado."
      : null,
  };
}

/**
 * Crecimiento anual necesario para que el precio objetivo del año 5 sea igual
 * al precio de hoy con los demás supuestos elegidos. No es una previsión.
 */
export function calculateImpliedExpectations(
  metrics: ValuationMetrics,
  inputs: ProjectionInputs,
): ImpliedExpectations {
  if (metrics.revenue === null || metrics.revenue <= 0 || metrics.marketCap === null) {
    return { revenueGrowth: null, reason: "Faltan ventas o capitalización de mercado." };
  }
  if (inputs.targetMultiple <= 0 || inputs.targetEbitMargin <= 0) {
    return { revenueGrowth: null, reason: "El margen y el múltiplo deben ser positivos." };
  }

  let requiredRevenue: number | null = null;
  const margin = inputs.targetEbitMargin / 100;

  if (inputs.targetMultipleType === "PE") {
    const afterTaxMargin = margin * (1 - inputs.taxRate / 100);
    if (afterTaxMargin > 0) {
      requiredRevenue = (metrics.marketCap / inputs.targetMultiple) / afterTaxMargin;
    }
  } else if (metrics.enterpriseValue !== null) {
    if (inputs.targetMultipleType === "EV_FCF" && metrics.historicalFcfConversion !== null) {
      const conversion = metrics.historicalFcfConversion / 100;
      if (conversion > 0) {
        requiredRevenue = (metrics.enterpriseValue / inputs.targetMultiple) / conversion / margin;
      }
    }
    if (
      inputs.targetMultipleType === "EV_EBITDA" &&
      metrics.historicalDepreciationMargin !== null
    ) {
      const ebitdaMargin = margin + metrics.historicalDepreciationMargin / 100;
      if (ebitdaMargin > 0) {
        requiredRevenue = (metrics.enterpriseValue / inputs.targetMultiple) / ebitdaMargin;
      }
    }
  }

  if (requiredRevenue === null || requiredRevenue <= 0) {
    return {
      revenueGrowth: null,
      reason: "El múltiplo elegido requiere conversión de caja, depreciación o deuda neta no disponibles.",
    };
  }

  return {
    revenueGrowth: (Math.pow(requiredRevenue / metrics.revenue, 1 / 5) - 1) * 100,
    reason: null,
  };
}
