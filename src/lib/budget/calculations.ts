import {
  BUDGET_CATEGORIES,
  BUDGET_CATEGORY_ORDER,
  type BudgetCategoryId,
  type BudgetCategoryConfig,
  type HistoricalPricePoint,
  type HistoricalCagrResult,
} from "./types";

export type BudgetBreakdownItem = {
  config: BudgetCategoryConfig;
  pct: number;
  isDefaultPct: boolean;
  amount: number;
  annualAmount: number;
};

export type BudgetBreakdownResult = {
  monthlyIncome: number;
  annualIncome: number;
  items: BudgetBreakdownItem[];
  totalPct: number;
  totalAllocated: number;
  isBalanced: boolean;
  remainingPct: number;
  remainingAmount: number;
  savingItem: BudgetBreakdownItem;
};

export function calculateBudgetBreakdown(
  monthlyIncome: number,
  customPcts?: Partial<Record<BudgetCategoryId, number>>,
): BudgetBreakdownResult {
  const safeIncome = Math.max(0, Number.isFinite(monthlyIncome) ? monthlyIncome : 0);
  const annualIncome = safeIncome * 12;

  let totalPct = 0;
  let totalAllocated = 0;

  const items: BudgetBreakdownItem[] = BUDGET_CATEGORY_ORDER.map((id) => {
    const config = BUDGET_CATEGORIES[id];
    const custom = customPcts?.[id];
    const pct = typeof custom === "number" && Number.isFinite(custom) && custom >= 0 ? custom : config.defaultPct;
    const isDefaultPct = pct === config.defaultPct;
    const amount = (safeIncome * pct) / 100;
    const annualAmount = amount * 12;

    totalPct += pct;
    totalAllocated += amount;

    return {
      config,
      pct,
      isDefaultPct,
      amount,
      annualAmount,
    };
  });

  const isBalanced = Math.abs(totalPct - 100) < 0.001;
  const remainingPct = 100 - totalPct;
  const remainingAmount = (safeIncome * remainingPct) / 100;
  const savingItem = items.find((item) => item.config.id === "ahorro")!;

  return {
    monthlyIncome: safeIncome,
    annualIncome,
    items,
    totalPct: Number(totalPct.toFixed(1)),
    totalAllocated,
    isBalanced,
    remainingPct: Number(remainingPct.toFixed(1)),
    remainingAmount,
    savingItem,
  };
}

export type CompoundInterestResult = {
  futureValue: number;
  totalContributed: number;
  totalInterest: number;
  principal: number;
  monthlyContribution: number;
  years: number;
  annualRatePct: number;
  multiplier: number;
  interestPctOfTotal: number;
};

export function calculateCompoundInterest(
  principal: number,
  monthlyContribution: number,
  years: number,
  annualRatePct: number,
): CompoundInterestResult {
  const P = Math.max(0, Number.isFinite(principal) ? principal : 0);
  const PMT = Math.max(0, Number.isFinite(monthlyContribution) ? monthlyContribution : 0);
  const t = Math.max(0, Number.isFinite(years) ? years : 0);
  const rate = Number.isFinite(annualRatePct) ? annualRatePct : 0;

  const n = Math.round(t * 12);
  const i = (rate / 100) / 12;

  let futureValue = 0;

  if (n === 0) {
    futureValue = P;
  } else if (Math.abs(i) < 1e-9) {
    futureValue = P + PMT * n;
  } else if (1 + i <= 0) {
    futureValue = 0;
  } else {
    const compoundFactor = Math.pow(1 + i, n);
    const principalGrowth = P * compoundFactor;
    const contributionsGrowth = PMT * ((compoundFactor - 1) / i);
    futureValue = Math.max(0, principalGrowth + contributionsGrowth);
  }

  const totalContributed = P + PMT * n;
  const totalInterest = futureValue - totalContributed;
  const multiplier = totalContributed > 0 ? futureValue / totalContributed : 1;
  const interestPctOfTotal = futureValue > 0 ? (Math.max(0, totalInterest) / futureValue) * 100 : 0;

  return {
    futureValue,
    totalContributed,
    totalInterest,
    principal: P,
    monthlyContribution: PMT,
    years: t,
    annualRatePct: rate,
    multiplier,
    interestPctOfTotal,
  };
}

export type CompoundInterestYearPoint = {
  year: number;
  label: string;
  totalContributed: number;
  totalInterest: number;
  totalAccumulated: number;
};

export function generateCompoundInterestYearlySeries(
  principal: number,
  monthlyContribution: number,
  years: number,
  annualRatePct: number,
): CompoundInterestYearPoint[] {
  const safeYears = Math.min(60, Math.max(1, Math.round(Number.isFinite(years) ? years : 1)));
  const series: CompoundInterestYearPoint[] = [];

  for (let year = 0; year <= safeYears; year += 1) {
    const res = calculateCompoundInterest(principal, monthlyContribution, year, annualRatePct);
    series.push({
      year,
      label: year === 0 ? "Inicio" : `Año ${year}`,
      totalContributed: Math.round(res.totalContributed),
      totalInterest: Math.round(res.totalInterest),
      totalAccumulated: Math.round(res.futureValue),
    });
  }

  return series;
}

/**
 * Calcula la tasa anualizada de crecimiento compuesto (CAGR) histórica de una acción
 * para el número de años solicitado mirando hacia atrás en el tiempo.
 */
export function calculateHistoricalCagr(
  points: readonly HistoricalPricePoint[],
  requestedYears: number,
  ticker = "",
  companyName = "",
): HistoricalCagrResult | null {
  const valid = (points ?? []).filter(
    (p) => p && typeof p.date === "string" && Number.isFinite(p.close) && p.close > 0,
  );

  if (valid.length < 2) return null;

  const sorted = [...valid].sort((a, b) => a.date.localeCompare(b.date));
  const endPoint = sorted[sorted.length - 1];
  const endTimestamp = new Date(endPoint.date).getTime();

  const targetYears = Math.max(1, Math.round(Number.isFinite(requestedYears) ? requestedYears : 1));
  const targetDate = new Date(endPoint.date);
  targetDate.setUTCFullYear(targetDate.getUTCFullYear() - targetYears);
  const targetTimestamp = targetDate.getTime();

  const firstTimestamp = new Date(sorted[0].date).getTime();
  const dayMs = 86_400_000;

  let startPoint = sorted[0];
  let hasEnoughHistory = true;

  // Si la fecha objetivo queda más de 45 días antes del primer dato disponible,
  // la cotización no tiene suficiente histórico para el plazo completo.
  if (targetTimestamp < firstTimestamp - 45 * dayMs) {
    startPoint = sorted[0];
    hasEnoughHistory = false;
  } else {
    // Buscamos el punto de cotización más próximo a la fecha objetivo
    let minDiff = Infinity;
    for (const pt of sorted) {
      const diff = Math.abs(new Date(pt.date).getTime() - targetTimestamp);
      if (diff < minDiff) {
        minDiff = diff;
        startPoint = pt;
      }
    }
  }

  const startTimestamp = new Date(startPoint.date).getTime();
  const diffDays = (endTimestamp - startTimestamp) / dayMs;
  if (diffDays < 7) return null; // Menos de una semana de separación

  const actualYears = Math.max(0.08, diffDays / 365.25);
  const startPrice = startPoint.close;
  const endPrice = endPoint.close;
  const totalReturnPct = ((endPrice - startPrice) / startPrice) * 100;

  let cagrPct = 0;
  if (startPrice > 0 && endPrice > 0) {
    const ratio = endPrice / startPrice;
    cagrPct = (Math.pow(ratio, 1 / actualYears) - 1) * 100;
  }

  return {
    ticker: ticker.toUpperCase(),
    companyName: companyName || ticker.toUpperCase(),
    startDate: startPoint.date,
    endDate: endPoint.date,
    startPrice,
    endPrice,
    actualYears: Number(actualYears.toFixed(1)),
    requestedYears: targetYears,
    hasEnoughHistory,
    totalReturnPct: Number(totalReturnPct.toFixed(2)),
    cagrPct: Number(cagrPct.toFixed(2)),
  };
}
