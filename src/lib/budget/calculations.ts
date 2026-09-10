import {
  BUDGET_CATEGORIES,
  BUDGET_CATEGORY_ORDER,
  type BudgetCategoryId,
  type BudgetCategoryConfig,
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
  const rate = Math.max(0, Number.isFinite(annualRatePct) ? annualRatePct : 0);

  const n = Math.round(t * 12);
  const i = (rate / 100) / 12;

  let futureValue = 0;

  if (n === 0) {
    futureValue = P;
  } else if (i === 0) {
    futureValue = P + PMT * n;
  } else {
    const compoundFactor = Math.pow(1 + i, n);
    const principalGrowth = P * compoundFactor;
    const contributionsGrowth = PMT * ((compoundFactor - 1) / i);
    futureValue = principalGrowth + contributionsGrowth;
  }

  const totalContributed = P + PMT * n;
  const totalInterest = Math.max(0, futureValue - totalContributed);
  const multiplier = totalContributed > 0 ? futureValue / totalContributed : 1;
  const interestPctOfTotal = futureValue > 0 ? (totalInterest / futureValue) * 100 : 0;

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
