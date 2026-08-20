import type { StatementBundle } from "../sec/statements";
import type { NormalizedStatement, PeriodKey } from "../sec/normalize";
import type { ValuationMetrics, ProjectionInputs, ValuationProjection, ProjectedYear } from "./types";

function getLatestValue(statement: NormalizedStatement | undefined, lineId: string, periodKey: PeriodKey): number | null {
  if (!statement) return null;
  const row = statement.rows.find((r) => r.line.id === lineId);
  if (!row) return null;
  return row.cells[periodKey]?.value ?? null;
}

export function buildValuationMetrics(
  bundle: StatementBundle,
  price: number,
  priceDate: string | null = null,
): ValuationMetrics {
  const income = bundle.blocks.find((b) => b.id === "income");
  const balance = bundle.blocks.find((b) => b.id === "balance");
  const cashflow = bundle.blocks.find((b) => b.id === "cashflow");
  const ratios = bundle.blocks.find((b) => b.id === "ratios");

  const latestPeriod = income?.periods[0] ?? balance?.periods[0] ?? cashflow?.periods[0];
  const pKey = latestPeriod?.key ?? "";
  const lastFiscalYear = latestPeriod?.fiscalYear ?? new Date().getFullYear();

  const revenue = getLatestValue(income, "revenue", pKey);
  const operatingIncome = getLatestValue(income, "operatingIncome", pKey);
  const pretaxIncome = getLatestValue(income, "pretaxIncome", pKey);
  const incomeTax = getLatestValue(income, "incomeTax", pKey);
  const netIncome = getLatestValue(income, "netIncome", pKey);
  const sharesDiluted = getLatestValue(income, "sharesDiluted", pKey);

  const depreciation = getLatestValue(cashflow, "depreciation", pKey);
  const freeCashFlow = getLatestValue(cashflow, "freeCashFlow", pKey);

  const cash = getLatestValue(balance, "cash", pKey);
  const shortTermInvestments = getLatestValue(balance, "shortTermInvestments", pKey);
  const longTermDebt = getLatestValue(balance, "longTermDebt", pKey);
  const shortTermDebt = getLatestValue(balance, "shortTermDebt", pKey);

  const totalCash = (cash !== null || shortTermInvestments !== null)
    ? (cash ?? 0) + (shortTermInvestments ?? 0)
    : null;
  const totalDebt = (longTermDebt !== null || shortTermDebt !== null)
    ? (longTermDebt ?? 0) + (shortTermDebt ?? 0)
    : null;

  const netDebt = (totalDebt !== null && totalCash !== null)
    ? totalDebt - totalCash
    : null;

  const ebitda = operatingIncome !== null
    ? operatingIncome + (depreciation ?? 0)
    : null;

  const marketCap = (sharesDiluted !== null && sharesDiluted > 0 && price > 0)
    ? price * sharesDiluted
    : null;

  const enterpriseValue = (marketCap !== null && netDebt !== null)
    ? marketCap + netDebt
    : null;

  // Múltiplos
  const pe = (marketCap !== null && netIncome !== null && netIncome > 0)
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

  // Promedios históricos / base para proyecciones
  const historicalEbitMargin = (revenue !== null && operatingIncome !== null && revenue > 0)
    ? (operatingIncome / revenue) * 100
    : 20;

  const historicalTaxRate = (pretaxIncome !== null && incomeTax !== null && pretaxIncome > 0)
    ? Math.min(Math.max((incomeTax / pretaxIncome) * 100, 0), 40)
    : 21;

  const historicalFcfConversion = (ebitda !== null && freeCashFlow !== null && ebitda > 0)
    ? Math.min(Math.max((freeCashFlow / ebitda) * 100, 10), 120)
    : 70;

  const historicalRevenueGrowth = getLatestValue(ratios, "revenueGrowthYoY", pKey) ?? 10;

  return {
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
    historicalEbitMargin,
    historicalFcfConversion,
    historicalTaxRate,
    lastFiscalYear,
  };
}

export function calculateProjection(
  metrics: ValuationMetrics,
  inputs: ProjectionInputs,
): ValuationProjection {
  const baseRevenue = metrics.revenue && metrics.revenue > 0 ? metrics.revenue : 1000;
  const baseShares = metrics.sharesDiluted && metrics.sharesDiluted > 0 ? metrics.sharesDiluted : 100;
  const startYear = metrics.lastFiscalYear ?? new Date().getFullYear();
  const conversionPct = (metrics.historicalFcfConversion ?? 70) / 100;
  const netDebt = metrics.netDebt ?? 0;

  const years: ProjectedYear[] = [];
  let currentRev = baseRevenue;
  let currentShares = baseShares;

  for (let i = 1; i <= 5; i++) {
    const yearNumber = startYear + i;
    const label = `${yearNumber}e`;

    currentRev = currentRev * (1 + inputs.revenueGrowth / 100);
    const ebit = currentRev * (inputs.targetEbitMargin / 100);
    const netIncome = ebit * (1 - inputs.taxRate / 100);
    const fcf = ebit * conversionPct;
    currentShares = currentShares * (1 + inputs.sharesGrowth / 100);

    let targetMarketCap = 0;
    if (inputs.targetMultipleType === "PE") {
      targetMarketCap = netIncome * inputs.targetMultiple;
    } else if (inputs.targetMultipleType === "EV_FCF") {
      const targetEV = fcf * inputs.targetMultiple;
      targetMarketCap = targetEV - netDebt;
    } else {
      // EV_EBITDA
      const ebitda = ebit * 1.15;
      const targetEV = ebitda * inputs.targetMultiple;
      targetMarketCap = targetEV - netDebt;
    }

    const targetPrice = currentShares > 0 ? Math.max(targetMarketCap / currentShares, 0) : 0;

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

  const targetPrice5Y = years[4]?.targetPrice ?? 0;
  const currentPrice = metrics.price > 0 ? metrics.price : 1;

  const marginOfSafety = ((targetPrice5Y - currentPrice) / currentPrice) * 100;
  const cagr5Y =
    targetPrice5Y > 0 && currentPrice > 0
      ? (Math.pow(targetPrice5Y / currentPrice, 1 / 5) - 1) * 100
      : 0;

  return {
    years,
    currentPrice,
    targetPrice5Y,
    marginOfSafety,
    cagr5Y,
  };
}
