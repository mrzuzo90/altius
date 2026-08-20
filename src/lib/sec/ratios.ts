import type { NormalizedStatement, Period, LineSeries, Cell, PeriodKey, Frequency } from "./normalize";
import { RATIOS_STATEMENT, type LineDef } from "./taxonomy";
import { pctChange } from "../format";

function getVal(statement: NormalizedStatement | undefined, lineId: string, periodKey: PeriodKey): number | null {
  if (!statement) return null;
  const row = statement.rows.find((r) => r.line.id === lineId);
  if (!row) return null;
  return row.cells[periodKey]?.value ?? null;
}

function findPriorYearPeriod(
  current: Period,
  allPeriods: Period[],
  frequency: Frequency,
): Period | undefined {
  if (frequency === "annual") {
    return allPeriods.find((p) => p.fiscalYear === current.fiscalYear - 1);
  }
  return allPeriods.find(
    (p) => p.fiscalYear === current.fiscalYear - 1 && p.quarter === current.quarter,
  );
}

/**
 * Genera el bloque normalizado de ratios a partir de los estados de ingresos, balance y flujos.
 */
export function buildRatiosStatement(
  income: NormalizedStatement,
  balance: NormalizedStatement,
  cashflow: NormalizedStatement,
  frequency: Frequency,
): NormalizedStatement {
  // Los periodos canónicos provienen de la cuenta de resultados (o el que tenga más periodos)
  const periods = income.periods.length >= cashflow.periods.length ? income.periods : cashflow.periods;
  if (periods.length === 0) {
    return { periods: [], rows: [] };
  }

  const rows: LineSeries[] = RATIOS_STATEMENT.map((line: LineDef) => {
    const cells: Record<PeriodKey, Cell> = {};

    for (const p of periods) {
      const revenue = getVal(income, "revenue", p.key);
      const grossProfit = getVal(income, "grossProfit", p.key);
      const operatingIncome = getVal(income, "operatingIncome", p.key);
      const depreciation = getVal(cashflow, "depreciation", p.key);
      const pretaxIncome = getVal(income, "pretaxIncome", p.key);
      const incomeTax = getVal(income, "incomeTax", p.key);
      const netIncome = getVal(income, "netIncome", p.key);
      const epsDiluted = getVal(income, "epsDiluted", p.key);
      const freeCashFlow = getVal(cashflow, "freeCashFlow", p.key);

      const equity = getVal(balance, "equity", p.key) ?? getVal(balance, "equityParent", p.key);
      const totalAssets = getVal(balance, "totalAssets", p.key);
      const cash = getVal(balance, "cash", p.key);
      const shortTermInvestments = getVal(balance, "shortTermInvestments", p.key);
      const longTermDebt = getVal(balance, "longTermDebt", p.key);
      const shortTermDebt = getVal(balance, "shortTermDebt", p.key);

      // EBITDA
      const ebitda =
        operatingIncome !== null ? operatingIncome + (depreciation ?? 0) : null;

      let val: number | null = null;

      switch (line.id) {
        case "grossMargin":
          val = revenue && grossProfit !== null ? (grossProfit / revenue) * 100 : null;
          break;

        case "ebitda":
          val = ebitda;
          break;

        case "ebitdaMargin":
          val = revenue && ebitda !== null ? (ebitda / revenue) * 100 : null;
          break;

        case "operatingMargin":
          val = revenue && operatingIncome !== null ? (operatingIncome / revenue) * 100 : null;
          break;

        case "netMargin":
          val = revenue && netIncome !== null ? (netIncome / revenue) * 100 : null;
          break;

        case "fcfMargin":
          val = revenue && freeCashFlow !== null ? (freeCashFlow / revenue) * 100 : null;
          break;

        case "roe":
          val = equity && netIncome !== null && equity > 0 ? (netIncome / equity) * 100 : null;
          break;

        case "roa":
          val = totalAssets && netIncome !== null && totalAssets > 0 ? (netIncome / totalAssets) * 100 : null;
          break;

        case "effectiveTaxRate":
          val = pretaxIncome && incomeTax !== null && pretaxIncome > 0 ? (incomeTax / pretaxIncome) * 100 : null;
          break;

        case "roic": {
          if (operatingIncome !== null && equity !== null) {
            const taxRate =
              pretaxIncome && incomeTax !== null && pretaxIncome > 0
                ? Math.min(Math.max(incomeTax / pretaxIncome, 0), 0.5)
                : 0.21;
            const nopat = operatingIncome * (1 - taxRate);
            const totalDebt = (longTermDebt ?? 0) + (shortTermDebt ?? 0);
            const totalCash = (cash ?? 0) + (shortTermInvestments ?? 0);
            const investedCapital = equity + totalDebt - totalCash;
            if (investedCapital > 0) {
              val = (nopat / investedCapital) * 100;
            }
          }
          break;
        }

        case "fcfConversion":
          val = freeCashFlow !== null && ebitda !== null && ebitda > 0 ? (freeCashFlow / ebitda) * 100 : null;
          break;

        case "revenueGrowthYoY": {
          const prior = findPriorYearPeriod(p, periods, frequency);
          if (prior && revenue !== null) {
            const priorRev = getVal(income, "revenue", prior.key);
            val = pctChange(revenue, priorRev);
          }
          break;
        }

        case "epsGrowthYoY": {
          const prior = findPriorYearPeriod(p, periods, frequency);
          if (prior && epsDiluted !== null) {
            const priorEps = getVal(income, "epsDiluted", prior.key);
            val = pctChange(epsDiluted, priorEps);
          }
          break;
        }

        case "fcfGrowthYoY": {
          const prior = findPriorYearPeriod(p, periods, frequency);
          if (prior && freeCashFlow !== null) {
            const priorFcf = getVal(cashflow, "freeCashFlow", prior.key);
            val = pctChange(freeCashFlow, priorFcf);
          }
          break;
        }

        default:
          val = null;
      }

      cells[p.key] = {
        value: val,
        derived: true,
      };
    }

    return {
      line,
      cells,
    };
  });

  return { periods, rows };
}
