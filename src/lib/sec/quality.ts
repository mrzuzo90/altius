import type { HistoricalPeSeries } from "../valuation/historical-pe";
import type { SplitEvent } from "../prices/types";
import type { NormalizedStatement, PeriodKey } from "./normalize";
import type { StatementBundle } from "./statements";

export type QualityItemStatus = "pass" | "warn" | "fail" | "unknown";
export type QualityMethodology = "operating" | "financial";

export type QualityCheckItem = {
  id: string;
  name: string;
  category: string;
  status: QualityItemStatus;
  valueFormatted: string;
  threshold: string;
  description: string;
  whyItMatters: string;
};

export type QualityScorecardResult = {
  score: number;
  /** El marco siempre contiene exactamente seis claves, aunque falte algún dato. */
  maxScore: 6;
  coverage: number;
  methodology: QualityMethodology;
  methodologyLabel: string;
  items: QualityCheckItem[];
};

export type QualityEvaluationContext = {
  historicalPe?: HistoricalPeSeries | null;
  splits?: SplitEvent[];
};

type Observation = { key: PeriodKey; year: number; value: number };

const MAX_HISTORY = 6;

function getRow(statement: NormalizedStatement | undefined, lineId: string) {
  return statement?.rows.find((row) => row.line.id === lineId);
}

function getValue(
  statement: NormalizedStatement | undefined,
  lineId: string,
  periodKey: PeriodKey,
): number | null {
  const value = getRow(statement, lineId)?.cells[periodKey]?.value;
  return value !== null && value !== undefined && Number.isFinite(value) ? value : null;
}

function getObservations(
  statement: NormalizedStatement | undefined,
  lineId: string,
  limit = MAX_HISTORY,
): Observation[] {
  if (!statement) return [];
  const row = getRow(statement, lineId);
  if (!row) return [];
  return statement.periods.flatMap((period): Observation[] => {
    const value = row.cells[period.key]?.value;
    return value !== null && value !== undefined && Number.isFinite(value)
      ? [{ key: period.key, year: period.fiscalYear, value }]
      : [];
  }).slice(0, limit);
}

function median(values: number[]): number | null {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function cagr(observations: Observation[]): number | null {
  if (observations.length < 2) return null;
  const newest = observations[0];
  const oldest = observations.at(-1)!;
  const years = Math.max(Math.abs(newest.year - oldest.year), observations.length - 1);
  if (years <= 0 || newest.value <= 0 || oldest.value <= 0) return null;
  return (Math.pow(newest.value / oldest.value, 1 / years) - 1) * 100;
}

function positiveRate(observations: Observation[]): number | null {
  return observations.length > 0
    ? observations.filter((observation) => observation.value > 0).length / observations.length
    : null;
}

function formatPercent(value: number | null, digits = 1, withSign = false): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const sign = withSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)} %`;
}

function formatMultiple(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "—" : `${value.toFixed(1)}x`;
}

function historyLabel(length: number): string {
  return `${length} ${length === 1 ? "ejercicio" : "ejercicios"}`;
}

function financialMethod(profile: StatementBundle["profile"]): "bank" | "insurer" | "financial" | null {
  const haystack = `${profile.name} ${profile.sector} ${profile.sicDescription}`.toLocaleLowerCase("en");
  const sic = Number.parseInt(profile.sic, 10);
  if (/insur|asegur|reinsur/.test(haystack) || (sic >= 6310 && sic <= 6411)) return "insurer";
  if (/bank|banco|banking|thrift|savings|credit union|lending|pr[eé]stam/.test(haystack)
    || (sic >= 6020 && sic <= 6169)) return "bank";
  if (/broker|securities|capital markets|investment bank/.test(haystack)
    || (sic >= 6200 && sic <= 6299)) return "financial";
  return null;
}

function bestEarningsSeries(income: NormalizedStatement | undefined): Observation[] {
  const diluted = getObservations(income, "epsDiluted");
  if (diluted.length >= 2) return diluted;
  const basic = getObservations(income, "epsBasic");
  if (basic.length >= 2) return basic;
  return getObservations(income, "netIncome");
}

function sumAvailable(values: Array<number | null>): number | null {
  const available = values.filter((value): value is number => value !== null);
  return available.length > 0 ? available.reduce((sum, value) => sum + value, 0) : null;
}

function evaluateGrowth(
  income: NormalizedStatement | undefined,
  isFinancial: boolean,
): QualityCheckItem {
  const revenue = getObservations(income, "revenue");
  const earnings = bestEarningsSeries(income);
  const revenueCagr = cagr(revenue);
  const earningsCagr = cagr(earnings);
  const rates = [revenueCagr, earningsCagr].filter((value): value is number => value !== null);
  const hasRequiredRates = isFinancial
    ? earningsCagr !== null
    : revenueCagr !== null && earningsCagr !== null;
  const depth = Math.max(revenue.length, earnings.length);

  let status: QualityItemStatus = "unknown";
  if (rates.length > 0) {
    if (hasRequiredRates && depth >= 3 && rates.every((rate) => rate >= 5)) status = "pass";
    else if (rates.every((rate) => rate >= 0)) status = "warn";
    else status = "fail";
  }

  const evidence = [
    revenueCagr !== null ? `ingresos ${formatPercent(revenueCagr, 1, true)}` : null,
    earningsCagr !== null ? `beneficio por acción ${formatPercent(earningsCagr, 1, true)}` : null,
  ].filter(Boolean).join(" · ");

  return {
    id: "growth",
    name: "Crecimiento duradero",
    category: "Negocio",
    status,
    valueFormatted: evidence || "—",
    threshold: "Ingresos y beneficio ≥ 5 % CAGR",
    description: evidence
      ? revenueCagr !== null && earningsCagr !== null
        ? status === "pass"
          ? `${historyLabel(depth)}: negocio y beneficio avanzan juntos por encima del umbral, sin depender de un único salto.`
          : status === "fail"
            ? `${historyLabel(depth)}: una de las dos series retrocede; ingresos y beneficio por acción no avanzan juntos.`
            : `${historyLabel(depth)}: ambas series se mantienen o crecen, pero alguna todavía no alcanza el 5 % anual.`
        : `${historyLabel(depth)}: solo hay una de las dos series comparables; Alti no da el crecimiento por completo.`
      : `No hay al menos dos ejercicios comparables de ${isFinancial ? "ingresos o beneficio" : "ingresos y beneficio"}.`,
    whyItMatters: "El valor sostenible nace de vender más y convertir ese avance en más beneficio por acción.",
  };
}

function evaluateReturns(
  ratios: NormalizedStatement | undefined,
  method: ReturnType<typeof financialMethod>,
): QualityCheckItem {
  const primaryId = method ? "roe" : "roic";
  const primary = getObservations(ratios, primaryId, 5);
  const fallback = method || primary.length > 0 ? [] : getObservations(ratios, "roe", 5);
  const observations = primary.length > 0 ? primary : fallback;
  const metric = primary.length > 0 ? primaryId : "roe";
  const typicalReturn = median(observations.map((observation) => observation.value));
  const highTarget = 12;
  const reviewTarget = metric === "roic" ? 7 : 8;

  let status: QualityItemStatus = "unknown";
  if (typicalReturn !== null) {
    if (typicalReturn >= highTarget) status = "pass";
    else if (typicalReturn >= reviewTarget) status = "warn";
    else status = "fail";
  }

  const metricLabel = metric === "roic" ? "ROIC" : method ? "ROE sectorial" : "ROE (proxy)";
  return {
    id: "returns",
    name: "Rentabilidad del capital",
    category: "Calidad",
    status,
    valueFormatted: typicalReturn === null ? "—" : `${metricLabel} ${formatPercent(typicalReturn)}`,
    threshold: `${metricLabel} mediano ≥ ${highTarget} %`,
    description: typicalReturn === null
      ? "No hay retornos sobre capital comparables en los estados disponibles."
      : `${metricLabel} mediano de ${formatPercent(typicalReturn)} durante ${historyLabel(observations.length)}; no depende de un año aislado.`,
    whyItMatters: "Un retorno alto y repetible es la mejor señal cuantitativa de ventaja competitiva y buena reinversión.",
  };
}

function evaluateCashQuality(
  income: NormalizedStatement | undefined,
  cashflow: NormalizedStatement | undefined,
  method: ReturnType<typeof financialMethod>,
): QualityCheckItem {
  const netIncome = getObservations(income, "netIncome", 5);

  if (method) {
    const profitableYears = positiveRate(netIncome);
    let status: QualityItemStatus = "unknown";
    if (profitableYears !== null) {
      if (netIncome.length >= 3 && profitableYears >= 0.8) status = "pass";
      else if (profitableYears >= 0.6) status = "warn";
      else status = "fail";
    }
    const profitableCount = netIncome.filter((observation) => observation.value > 0).length;
    return {
      id: "cashQuality",
      name: "Beneficio fiable",
      category: "Beneficio",
      status,
      valueFormatted: profitableYears === null ? "—" : `${profitableCount}/${netIncome.length} años positivos`,
      threshold: "Beneficio positivo ≥ 80 % de los años",
      description: profitableYears === null
        ? "No hay una serie suficiente de resultado neto para medir su estabilidad."
        : `Beneficio positivo en ${profitableCount} de ${netIncome.length} ejercicios; la franquicia gana dinero con regularidad.`,
      whyItMatters: "La regularidad del beneficio ayuda a separar una franquicia financiera sólida de un resultado puntual.",
    };
  }

  const periods = income?.periods.slice(0, 5) ?? [];
  const conversionPairs = periods.flatMap((period) => {
    const earnings = getValue(income, "netIncome", period.key);
    const operatingCash = getValue(cashflow, "operatingCashFlow", period.key);
    return earnings !== null && earnings > 0 && operatingCash !== null
      ? [{ earnings, operatingCash }]
      : [];
  });
  const totalEarnings = conversionPairs.reduce((sum, pair) => sum + pair.earnings, 0);
  const cashConversion = totalEarnings > 0
    ? conversionPairs.reduce((sum, pair) => sum + pair.operatingCash, 0) / totalEarnings
    : null;
  const fcf = getObservations(cashflow, "freeCashFlow", 5);
  const fcfPositiveRate = positiveRate(fcf);

  let status: QualityItemStatus = "unknown";
  if (cashConversion !== null && fcfPositiveRate !== null) {
    if (cashConversion >= 0.9 && fcfPositiveRate >= 0.75) status = "pass";
    else if (cashConversion >= 0.6 && fcfPositiveRate >= 0.5) status = "warn";
    else status = "fail";
  } else if (cashConversion !== null) {
    status = cashConversion >= 0.9 ? "pass" : cashConversion >= 0.6 ? "warn" : "fail";
  } else if (fcfPositiveRate !== null) {
    status = fcf.length >= 3 && fcfPositiveRate >= 0.8
      ? "pass"
      : fcfPositiveRate >= 0.5 ? "warn" : "fail";
  }

  const fcfPositiveCount = fcf.filter((observation) => observation.value > 0).length;
  const evidence = [
    cashConversion !== null ? `CFO/beneficio ${formatPercent(cashConversion * 100, 0)}` : null,
    fcfPositiveRate !== null ? `FCF positivo ${fcfPositiveCount}/${fcf.length}` : null,
  ].filter(Boolean).join(" · ");

  return {
    id: "cashQuality",
    name: "Beneficio convertido en caja",
    category: "Caja",
    status,
    valueFormatted: evidence || "—",
    threshold: "CFO/beneficio ≥ 90 % y FCF recurrente",
    description: evidence
      ? "La conversión y la recurrencia se sostienen al agregar hasta cinco ejercicios, no solo el último año."
      : "No hay flujo operativo, beneficio y FCF comparables suficientes.",
    whyItMatters: "La caja confirma que el beneficio contable es utilizable para reinvertir, reducir deuda o remunerar al accionista.",
  };
}

function evaluateBalance(
  balance: NormalizedStatement | undefined,
  ratios: NormalizedStatement | undefined,
  method: ReturnType<typeof financialMethod>,
): QualityCheckItem {
  if (method) {
    const capitalRatios = (balance?.periods.slice(0, 5) ?? []).flatMap((period): number[] => {
      const equity = getValue(balance, "equity", period.key) ?? getValue(balance, "equityParent", period.key);
      const assets = getValue(balance, "totalAssets", period.key);
      return equity !== null && assets !== null && assets > 0 ? [(equity / assets) * 100] : [];
    });
    const latest = capitalRatios[0] ?? null;
    const typical = median(capitalRatios);
    const passTarget = method === "insurer" ? 10 : 7;
    const warnTarget = method === "insurer" ? 6 : 4.5;
    let status: QualityItemStatus = "unknown";
    if (latest !== null && typical !== null) {
      if (latest >= passTarget && typical >= passTarget) status = "pass";
      else if (latest >= warnTarget && typical >= warnTarget) status = "warn";
      else status = "fail";
    }
    return {
      id: "balance",
      name: "Balance resistente",
      category: "Solvencia",
      status,
      valueFormatted: typical === null ? "—" : `Patrimonio/activo ${formatPercent(typical)}`,
      threshold: `Patrimonio/activo ≥ ${passTarget} %`,
      description: typical === null
        ? "No hay activo y patrimonio comparables para estimar el colchón contable."
        : `Colchón mediano del ${formatPercent(typical)} del activo en ${historyLabel(capitalRatios.length)}; no sustituye CET1 ni solvencia regulatoria.`,
      whyItMatters: "En bancos y aseguradoras importa el colchón que absorbe pérdidas, no una deuda/EBITDA industrial.",
    };
  }

  const leverage = (balance?.periods.slice(0, 5) ?? []).flatMap((period): number[] => {
    const debt = sumAvailable([
      getValue(balance, "longTermDebt", period.key),
      getValue(balance, "shortTermDebt", period.key),
    ]);
    const liquidity = sumAvailable([
      getValue(balance, "cash", period.key),
      getValue(balance, "shortTermInvestments", period.key),
    ]);
    const ebitda = getValue(ratios, "ebitda", period.key);
    if (debt === null || liquidity === null || ebitda === null || ebitda <= 0) return [];
    return [(debt - liquidity) / ebitda];
  });
  const latestLeverage = leverage[0] ?? null;
  const typicalLeverage = median(leverage);
  let status: QualityItemStatus = "unknown";
  if (latestLeverage !== null && typicalLeverage !== null) {
    if (latestLeverage <= 2 && typicalLeverage <= 2) status = "pass";
    else if (latestLeverage <= 3.5 && typicalLeverage <= 3.5) status = "warn";
    else status = "fail";
  }
  const valueFormatted = typicalLeverage === null
    ? "—"
    : typicalLeverage <= 0 ? "Caja neta" : `${formatMultiple(typicalLeverage)} EBITDA`;
  return {
    id: "balance",
    name: "Balance resistente",
    category: "Solvencia",
    status,
    valueFormatted,
    threshold: "Caja neta o deuda neta ≤ 2x EBITDA",
    description: typicalLeverage === null
      ? "Falta deuda, liquidez o EBITDA comparable para calcular el apalancamiento sin inventar datos."
      : `Apalancamiento mediano de ${formatMultiple(typicalLeverage)} y último de ${formatMultiple(latestLeverage)} en ${historyLabel(leverage.length)}.`,
    whyItMatters: "Un balance prudente permite atravesar recesiones y seguir invirtiendo cuando el crédito se encarece.",
  };
}

function splitAdjusted(value: number, knownAt: string, splits: SplitEvent[]): number {
  return splits
    .filter((split) => split.date > knownAt && split.numerator > 0 && split.denominator > 0)
    .reduce((adjusted, split) => adjusted * (split.numerator / split.denominator), value);
}

function firstReportedValue(statement: NormalizedStatement, lineId: string, key: PeriodKey): { value: number; knownAt: string } | null {
  const cell = getRow(statement, lineId)?.cells[key];
  const value = cell?.firstReported?.value ?? cell?.value;
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const knownAt = cell?.firstReported?.filed
    ?? (cell?.provenance.kind === "reported" ? cell.provenance.filed : null)
    ?? statement.periods.find((period) => period.key === key)?.end
    ?? "9999-12-31";
  return { value, knownAt };
}

function shareObservations(income: NormalizedStatement | undefined, splits: SplitEvent[]): Observation[] {
  if (!income) return [];
  return income.periods.flatMap((period): Observation[] => {
    const reported = firstReportedValue(income, "sharesDiluted", period.key);
    if (reported !== null && reported.value > 0) {
      return [{
        key: period.key,
        year: period.fiscalYear,
        value: splitAdjusted(reported.value, reported.knownAt, splits),
      }];
    }
    const earnings = firstReportedValue(income, "netIncome", period.key);
    const eps = firstReportedValue(income, "epsDiluted", period.key) ?? firstReportedValue(income, "epsBasic", period.key);
    const derived = earnings !== null && eps !== null && eps.value !== 0 ? earnings.value / eps.value : null;
    return derived !== null && derived > 0
      ? [{ key: period.key, year: period.fiscalYear, value: splitAdjusted(derived, eps!.knownAt, splits) }]
      : [];
  }).slice(0, MAX_HISTORY);
}

function evaluatePerShareDiscipline(income: NormalizedStatement | undefined, splits: SplitEvent[]): QualityCheckItem {
  const shares = shareObservations(income, splits);
  const sharesCagr = cagr(shares);
  let status: QualityItemStatus = "unknown";
  if (sharesCagr !== null) {
    if (shares.length >= 3 && sharesCagr <= 0) status = "pass";
    else if (sharesCagr <= 2) status = "warn";
    else status = "fail";
  }
  return {
    id: "perShare",
    name: "Disciplina por acción",
    category: "Accionista",
    status,
    valueFormatted: sharesCagr === null ? "—" : `Acciones ${formatPercent(sharesCagr, 1, true)} anual`,
    threshold: "Acciones estables o decrecientes",
    description: sharesCagr === null
      ? "No hay al menos dos ejercicios de acciones diluidas, ni datos para derivarlas con beneficio y BPA."
      : `Las acciones diluidas cambian un ${formatPercent(sharesCagr, 1, true)} anual durante ${historyLabel(shares.length)}.`,
    whyItMatters: "El crecimiento solo crea valor por título si la dirección no lo diluye con nuevas acciones de forma persistente.",
  };
}

function evaluateValuation(historicalPe: HistoricalPeSeries | null | undefined): QualityCheckItem {
  const currentPe = historicalPe?.currentPe ?? null;
  const historyMedian = historicalPe?.median20Y ?? historicalPe?.median10Y ?? historicalPe?.medianAll ?? null;
  const premium = currentPe !== null && historyMedian !== null && historyMedian > 0
    ? ((currentPe / historyMedian) - 1) * 100
    : null;
  let status: QualityItemStatus = "unknown";
  if (currentPe !== null && premium !== null) {
    if (premium <= 0) status = "pass";
    else if (premium <= 25) status = "warn";
    else status = "fail";
  } else if (currentPe !== null) {
    if (currentPe <= 20) status = "pass";
    else if (currentPe <= 30) status = "warn";
    else status = "fail";
  } else if (
    historicalPe?.currentPrice !== null
    && historicalPe?.currentPrice !== undefined
    && historicalPe.latestEps !== null
    && historicalPe.latestEps <= 0
  ) {
    status = "fail";
  }

  const valueFormatted = currentPe !== null
    ? premium !== null
      ? `PER ${currentPe.toFixed(1)}x · ${premium > 0 ? "+" : ""}${premium.toFixed(0)} % vs historia`
      : `PER ${currentPe.toFixed(1)}x`
    : historicalPe?.latestEps !== null && historicalPe?.latestEps !== undefined && historicalPe.latestEps <= 0
      ? "Sin PER · pérdidas"
      : "—";
  const description = currentPe !== null && historyMedian !== null
    ? `PER actual de ${currentPe.toFixed(1)}x frente a mediana histórica de ${historyMedian.toFixed(1)}x: ${formatPercent(premium, 0, true)} de diferencia.`
    : currentPe !== null
      ? `El PER actual es ${currentPe.toFixed(1)}x. Al no haber una historia suficiente, se usa una banda absoluta conservadora.`
      : historicalPe?.reason ?? "No hay precio y BPA en la misma divisa para juzgar la valoración sin mezclar unidades.";

  return {
    id: "valuation",
    name: "Precio con margen",
    category: "Valoración",
    status,
    valueFormatted,
    threshold: historyMedian !== null ? "PER ≤ su mediana histórica" : "PER ≤ 20x (sin historia)",
    description,
    whyItMatters: "Una valoración muy alta implica expectativas más exigentes y reduce el margen frente a resultados peores de lo previsto.",
  };
}

/**
 * Las seis claves combinan los ocho pilares de Everything Money con el marco
 * económico de retorno sobre capital, caja, riesgo y precio de CFA, Buffett,
 * Damodaran y McKinsey. Se evalúan sobre varios ejercicios y con equivalentes
 * específicos para entidades financieras.
 */
export function evaluateQualityScorecard(
  bundle: StatementBundle,
  context: QualityEvaluationContext = {},
): QualityScorecardResult {
  const income = bundle.blocks.find((block) => block.id === "income");
  const balance = bundle.blocks.find((block) => block.id === "balance");
  const cashflow = bundle.blocks.find((block) => block.id === "cashflow");
  const ratios = bundle.blocks.find((block) => block.id === "ratios");
  const method = financialMethod(bundle.profile);

  const items: QualityCheckItem[] = [
    evaluateGrowth(income, Boolean(method)),
    evaluateReturns(ratios, method),
    evaluateCashQuality(income, cashflow, method),
    evaluateBalance(balance, ratios, method),
    evaluatePerShareDiscipline(income, context.splits ?? []),
    evaluateValuation(context.historicalPe),
  ];
  const score = items.filter((item) => item.status === "pass").length;
  const coverage = items.filter((item) => item.status !== "unknown").length;

  return {
    score,
    maxScore: 6,
    coverage,
    methodology: method ? "financial" : "operating",
    methodologyLabel: method
      ? "Método sectorial para bancos, aseguradoras y mercados de capitales"
      : "Método para empresas operativas",
    items,
  };
}
