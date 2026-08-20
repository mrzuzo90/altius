import type { NormalizedStatement, Period, LineSeries, Cell, PeriodKey, Frequency } from "./normalize";
import { RATIOS_STATEMENT, type LineDef } from "./taxonomy";
import { pctChange } from "../format";
import type { Provenance } from "./provenance";

function getVal(statement: NormalizedStatement | undefined, lineId: string, periodKey: PeriodKey): number | null {
  if (!statement) return null;
  const row = statement.rows.find((r) => r.line.id === lineId);
  if (!row) return null;
  return row.cells[periodKey]?.value ?? null;
}

/** Gemela de `getVal`: la procedencia del mismo valor, para las citas de la interfaz. */
function getSource(statement: NormalizedStatement | undefined, lineId: string, periodKey: PeriodKey): Provenance {
  if (!statement) return { kind: "absent" };
  const row = statement.rows.find((r) => r.line.id === lineId);
  if (!row) return { kind: "absent" };
  return row.cells[periodKey]?.provenance ?? { kind: "absent" };
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
 * Expresión legible de cada ratio, para el popover de procedencia.
 *
 * Las catorce claves son exactamente los `id` de `RATIOS_STATEMENT`
 * (`taxonomy.ts:157`). Si se añade una línea allí y no aquí, su celda se queda
 * sin fórmula: el test del paso 12 lo detecta.
 */
const FORMULAS: Record<string, string> = {
  grossMargin: "Beneficio bruto ÷ Ingresos × 100",
  ebitda: "Resultado de explotación + Amortizaciones",
  ebitdaMargin: "EBITDA ÷ Ingresos × 100",
  operatingMargin: "Resultado de explotación ÷ Ingresos × 100",
  netMargin: "Resultado neto ÷ Ingresos × 100",
  fcfMargin: "Flujo de caja libre ÷ Ingresos × 100",
  roe: "Resultado neto ÷ Patrimonio neto × 100",
  roa: "Resultado neto ÷ Activo total × 100",
  roic: "Resultado de explotación × (1 − tipo efectivo) ÷ (Patrimonio neto + Deuda − Caja) × 100",
  effectiveTaxRate: "Impuesto sobre beneficios ÷ Resultado antes de impuestos × 100",
  fcfConversion: "Flujo de caja libre ÷ EBITDA × 100",
  revenueGrowthYoY: "Ingresos del periodo ÷ Ingresos del mismo periodo del año anterior − 1",
  epsGrowthYoY: "BPA diluido ÷ BPA diluido del mismo periodo del año anterior − 1",
  fcfGrowthYoY: "Flujo de caja libre ÷ Flujo de caja libre del año anterior − 1",
};

type Entrada = { label: string; value: number; source: Provenance };

/** Descarta una entrada cuyo valor es nulo: no se cita lo que no interviene. */
const entrada = (label: string, value: number | null, source: Provenance): Entrada | null =>
  value === null ? null : { label, value, source };

const conValor = (candidatas: (Entrada | null)[]): Entrada[] =>
  candidatas.filter((c): c is Entrada => c !== null);

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
      const revenueSrc = getSource(income, "revenue", p.key);
      const grossProfit = getVal(income, "grossProfit", p.key);
      const grossProfitSrc = getSource(income, "grossProfit", p.key);
      const operatingIncome = getVal(income, "operatingIncome", p.key);
      const operatingIncomeSrc = getSource(income, "operatingIncome", p.key);
      const depreciation = getVal(cashflow, "depreciation", p.key);
      const depreciationSrc = getSource(cashflow, "depreciation", p.key);
      const pretaxIncome = getVal(income, "pretaxIncome", p.key);
      const pretaxIncomeSrc = getSource(income, "pretaxIncome", p.key);
      const incomeTax = getVal(income, "incomeTax", p.key);
      const incomeTaxSrc = getSource(income, "incomeTax", p.key);
      const netIncome = getVal(income, "netIncome", p.key);
      const netIncomeSrc = getSource(income, "netIncome", p.key);
      const epsDiluted = getVal(income, "epsDiluted", p.key);
      const epsDilutedSrc = getSource(income, "epsDiluted", p.key);
      const freeCashFlow = getVal(cashflow, "freeCashFlow", p.key);
      const freeCashFlowSrc = getSource(cashflow, "freeCashFlow", p.key);

      const equityPropia = getVal(balance, "equity", p.key);
      const equity = equityPropia ?? getVal(balance, "equityParent", p.key);
      const equitySrc =
        equityPropia !== null ? getSource(balance, "equity", p.key) : getSource(balance, "equityParent", p.key);
      const totalAssets = getVal(balance, "totalAssets", p.key);
      const totalAssetsSrc = getSource(balance, "totalAssets", p.key);
      const cash = getVal(balance, "cash", p.key);
      const cashSrc = getSource(balance, "cash", p.key);
      const shortTermInvestments = getVal(balance, "shortTermInvestments", p.key);
      const shortTermInvestmentsSrc = getSource(balance, "shortTermInvestments", p.key);
      const longTermDebt = getVal(balance, "longTermDebt", p.key);
      const longTermDebtSrc = getSource(balance, "longTermDebt", p.key);
      const shortTermDebt = getVal(balance, "shortTermDebt", p.key);
      const shortTermDebtSrc = getSource(balance, "shortTermDebt", p.key);

      // EBITDA
      const ebitda =
        operatingIncome !== null ? operatingIncome + (depreciation ?? 0) : null;
      // Sus dos componentes reales, para citarlos en cualquier ratio que use EBITDA.
      const ebitdaEntradas = conValor([
        entrada("Resultado de explotación", operatingIncome, operatingIncomeSrc),
        entrada("Amortizaciones", depreciation, depreciationSrc),
      ]);

      let val: number | null = null;
      let entradas: Entrada[] = [];

      switch (line.id) {
        case "grossMargin":
          val = revenue && grossProfit !== null ? (grossProfit / revenue) * 100 : null;
          entradas = conValor([
            entrada("Beneficio bruto", grossProfit, grossProfitSrc),
            entrada("Ingresos", revenue, revenueSrc),
          ]);
          break;

        case "ebitda":
          val = ebitda;
          entradas = ebitdaEntradas;
          break;

        case "ebitdaMargin":
          val = revenue && ebitda !== null ? (ebitda / revenue) * 100 : null;
          entradas = [...ebitdaEntradas, ...conValor([entrada("Ingresos", revenue, revenueSrc)])];
          break;

        case "operatingMargin":
          val = revenue && operatingIncome !== null ? (operatingIncome / revenue) * 100 : null;
          entradas = conValor([
            entrada("Resultado de explotación", operatingIncome, operatingIncomeSrc),
            entrada("Ingresos", revenue, revenueSrc),
          ]);
          break;

        case "netMargin":
          val = revenue && netIncome !== null ? (netIncome / revenue) * 100 : null;
          entradas = conValor([
            entrada("Resultado neto", netIncome, netIncomeSrc),
            entrada("Ingresos", revenue, revenueSrc),
          ]);
          break;

        case "fcfMargin":
          val = revenue && freeCashFlow !== null ? (freeCashFlow / revenue) * 100 : null;
          entradas = conValor([
            entrada("Flujo de caja libre", freeCashFlow, freeCashFlowSrc),
            entrada("Ingresos", revenue, revenueSrc),
          ]);
          break;

        case "roe":
          val = equity && netIncome !== null && equity > 0 ? (netIncome / equity) * 100 : null;
          entradas = conValor([
            entrada("Resultado neto", netIncome, netIncomeSrc),
            entrada("Patrimonio neto", equity, equitySrc),
          ]);
          break;

        case "roa":
          val = totalAssets && netIncome !== null && totalAssets > 0 ? (netIncome / totalAssets) * 100 : null;
          entradas = conValor([
            entrada("Resultado neto", netIncome, netIncomeSrc),
            entrada("Activo total", totalAssets, totalAssetsSrc),
          ]);
          break;

        case "effectiveTaxRate":
          val = pretaxIncome && incomeTax !== null && pretaxIncome > 0 ? (incomeTax / pretaxIncome) * 100 : null;
          entradas = conValor([
            entrada("Impuesto sobre beneficios", incomeTax, incomeTaxSrc),
            entrada("Resultado antes de impuestos", pretaxIncome, pretaxIncomeSrc),
          ]);
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
              entradas = conValor([
                entrada("Resultado de explotación", operatingIncome, operatingIncomeSrc),
                entrada("Resultado antes de impuestos", pretaxIncome, pretaxIncomeSrc),
                entrada("Impuesto sobre beneficios", incomeTax, incomeTaxSrc),
                entrada("Patrimonio neto", equity, equitySrc),
                entrada("Deuda a largo plazo", longTermDebt, longTermDebtSrc),
                entrada("Deuda a corto plazo", shortTermDebt, shortTermDebtSrc),
                entrada("Efectivo y equivalentes", cash, cashSrc),
                entrada("Inversiones a corto plazo", shortTermInvestments, shortTermInvestmentsSrc),
              ]);
            }
          }
          break;
        }

        case "fcfConversion":
          val = freeCashFlow !== null && ebitda !== null && ebitda > 0 ? (freeCashFlow / ebitda) * 100 : null;
          entradas = [...conValor([entrada("Flujo de caja libre", freeCashFlow, freeCashFlowSrc)]), ...ebitdaEntradas];
          break;

        case "revenueGrowthYoY": {
          const prior = findPriorYearPeriod(p, periods, frequency);
          if (prior && revenue !== null) {
            const priorRev = getVal(income, "revenue", prior.key);
            val = pctChange(revenue, priorRev);
            entradas = conValor([
              entrada("Ingresos del periodo", revenue, revenueSrc),
              entrada("Ingresos del año anterior", priorRev, getSource(income, "revenue", prior.key)),
            ]);
          }
          break;
        }

        case "epsGrowthYoY": {
          const prior = findPriorYearPeriod(p, periods, frequency);
          if (prior && epsDiluted !== null) {
            const priorEps = getVal(income, "epsDiluted", prior.key);
            val = pctChange(epsDiluted, priorEps);
            entradas = conValor([
              entrada("BPA diluido del periodo", epsDiluted, epsDilutedSrc),
              entrada("BPA diluido del año anterior", priorEps, getSource(income, "epsDiluted", prior.key)),
            ]);
          }
          break;
        }

        case "fcfGrowthYoY": {
          const prior = findPriorYearPeriod(p, periods, frequency);
          if (prior && freeCashFlow !== null) {
            const priorFcf = getVal(cashflow, "freeCashFlow", prior.key);
            val = pctChange(freeCashFlow, priorFcf);
            entradas = conValor([
              entrada("Flujo de caja libre del periodo", freeCashFlow, freeCashFlowSrc),
              entrada(
                "Flujo de caja libre del año anterior",
                priorFcf,
                getSource(cashflow, "freeCashFlow", prior.key),
              ),
            ]);
          }
          break;
        }

        default:
          val = null;
      }

      const formula = FORMULAS[line.id];
      const provenance: Provenance =
        val === null || !formula
          ? { kind: "absent" }
          : { kind: "derived", formula, inputs: entradas };
      cells[p.key] = { value: val, derived: true, provenance };
    }

    return {
      line,
      cells,
    };
  });

  return { periods, rows };
}
