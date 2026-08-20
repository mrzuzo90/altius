import type { StatementBundle } from "./statements";
import type { NormalizedStatement, PeriodKey } from "./normalize";

export type QualityItemStatus = "pass" | "warn" | "fail";

export type QualityCheckItem = {
  id: string;
  name: string;
  category: string;
  status: QualityItemStatus;
  valueFormatted: string;
  threshold: string;
  description: string;
};

export type QualityScorecardResult = {
  score: number;
  maxScore: number;
  verdict: string;
  verdictDescription: string;
  items: QualityCheckItem[];
};

function getRowValues(statement: NormalizedStatement | undefined, lineId: string): number[] {
  if (!statement) return [];
  const row = statement.rows.find((r) => r.line.id === lineId);
  if (!row) return [];
  return statement.periods
    .map((p) => row.cells[p.key]?.value)
    .filter((v): v is number => v !== null && Number.isFinite(v));
}

function getLatestVal(statement: NormalizedStatement | undefined, lineId: string, pKey: PeriodKey): number | null {
  if (!statement) return null;
  const row = statement.rows.find((r) => r.line.id === lineId);
  if (!row) return null;
  return row.cells[pKey]?.value ?? null;
}

export function evaluateQualityScorecard(bundle: StatementBundle): QualityScorecardResult {
  const income = bundle.blocks.find((b) => b.id === "income");
  const balance = bundle.blocks.find((b) => b.id === "balance");
  const ratios = bundle.blocks.find((b) => b.id === "ratios");

  const latestPKey = income?.periods[0]?.key ?? "";

  // 1. ROIC
  const roicVals = getRowValues(ratios, "roic");
  const latestRoic = roicVals[0] ?? null;

  let roicStatus: QualityItemStatus = "fail";
  if (latestRoic !== null && latestRoic >= 15) roicStatus = "pass";
  else if (latestRoic !== null && latestRoic >= 8) roicStatus = "warn";

  // 2. Márgenes y Pricing Power
  const grossMargin = getLatestVal(ratios, "grossMargin", latestPKey);
  const opMargin = getLatestVal(ratios, "operatingMargin", latestPKey);

  let marginStatus: QualityItemStatus = "fail";
  if (grossMargin !== null && opMargin !== null) {
    if (grossMargin >= 40 && opMargin >= 15) marginStatus = "pass";
    else if (grossMargin >= 25 && opMargin >= 8) marginStatus = "warn";
  }

  // 3. Solvencia y Deuda
  const cash = (getLatestVal(balance, "cash", latestPKey) ?? 0) + (getLatestVal(balance, "shortTermInvestments", latestPKey) ?? 0);
  const debt = (getLatestVal(balance, "longTermDebt", latestPKey) ?? 0) + (getLatestVal(balance, "shortTermDebt", latestPKey) ?? 0);
  const ebitda = getLatestVal(ratios, "ebitda", latestPKey);
  const netDebt = debt - cash;

  let debtStatus: QualityItemStatus = "fail";
  let debtFmt = "—";
  if (netDebt <= 0) {
    debtStatus = "pass";
    debtFmt = "Caja Neta";
  } else if (ebitda && ebitda > 0) {
    const ratio = netDebt / ebitda;
    debtFmt = `${ratio.toFixed(1)}x EBITDA`;
    if (ratio <= 2.0) debtStatus = "pass";
    else if (ratio <= 3.5) debtStatus = "warn";
  } else {
    debtFmt = "Deuda elevada";
  }

  // 4. Conversión de Caja (FCF / EBITDA)
  const fcfConversion = getLatestVal(ratios, "fcfConversion", latestPKey);
  let conversionStatus: QualityItemStatus = "fail";
  if (fcfConversion !== null) {
    if (fcfConversion >= 65) conversionStatus = "pass";
    else if (fcfConversion >= 40) conversionStatus = "warn";
  }

  // 5. Recompras netas / Dilución de acciones
  const shares = getRowValues(income, "sharesDiluted");
  let sharesStatus: QualityItemStatus = "warn";
  let sharesFmt = "—";
  if (shares.length >= 2) {
    const actualShares = shares[0];
    const prevShares = shares[shares.length - 1];
    const change = ((actualShares - prevShares) / prevShares) * 100;
    sharesFmt = `${change >= 0 ? "+" : ""}${change.toFixed(1)} % (${shares.length} años)`;
    if (change <= -2) sharesStatus = "pass";
    else if (change <= 5) sharesStatus = "warn";
    else sharesStatus = "fail";
  }

  // 6. Crecimiento de ingresos
  const revGrowth = getLatestVal(ratios, "revenueGrowthYoY", latestPKey);
  let growthStatus: QualityItemStatus = "fail";
  if (revGrowth !== null) {
    if (revGrowth >= 8) growthStatus = "pass";
    else if (revGrowth >= 0) growthStatus = "warn";
  }

  const items: QualityCheckItem[] = [
    {
      id: "roic",
      name: "Retorno sobre Capital (ROIC)",
      category: "Rentabilidad",
      status: roicStatus,
      valueFormatted: latestRoic !== null ? `${latestRoic.toFixed(1)} %` : "—",
      threshold: ">= 15 %",
      description: "Indica si la empresa genera altos retornos sobre el capital que reinvierte en su negocio.",
    },
    {
      id: "margins",
      name: "Poder de Fijación de Precios",
      category: "Ventaja Competitiva",
      status: marginStatus,
      valueFormatted:
        grossMargin !== null && opMargin !== null
          ? `Bruto: ${grossMargin.toFixed(1)}% | EBIT: ${opMargin.toFixed(1)}%`
          : "—",
      threshold: "Bruto >= 40% y EBIT >= 15%",
      description: "Márgenes elevados demuestran foso defensivo y resistencia frente a costes crecientes.",
    },
    {
      id: "debt",
      name: "Fortaleza de Balance",
      category: "Solvencia",
      status: debtStatus,
      valueFormatted: debtFmt,
      threshold: "Caja Neta o Deuda < 2.0x EBITDA",
      description: "Protege al negocio en ciclos bajistas y permite autofinanciarse sin depender de crédito.",
    },
    {
      id: "fcfConversion",
      name: "Conversión de Beneficio en Caja",
      category: "Calidad Contable",
      status: conversionStatus,
      valueFormatted: fcfConversion !== null ? `${fcfConversion.toFixed(1)} %` : "—",
      threshold: ">= 65 % del EBITDA",
      description: "Garantiza que los beneficios contables se transforman en dinero contante y sonante.",
    },
    {
      id: "shares",
      name: "Recompras de Acciones",
      category: "Asignación de Capital",
      status: sharesStatus,
      valueFormatted: sharesFmt,
      threshold: "Reducción neta de acciones",
      description: "Una directiva alineada retira acciones del mercado aumentando el valor por título.",
    },
    {
      id: "growth",
      name: "Crecimiento de Ingresos",
      category: "Expansión",
      status: growthStatus,
      valueFormatted: revGrowth !== null ? `${revGrowth >= 0 ? "+" : ""}${revGrowth.toFixed(1)} % YoY` : "—",
      threshold: ">= 8 % anual",
      description: "Crecimiento orgánico continuo impulsado por demanda de mercado.",
    },
  ];

  const score = items.filter((i) => i.status === "pass").length;
  const maxScore = items.length;

  let verdict = "Calidad Aceptable";
  let verdictDescription = "Cumple con parte de los criterios pero presenta aspectos a monitorizar.";

  if (score >= 5) {
    verdict = "Calidad Excelente (Compounder)";
    verdictDescription = "Cumple prácticamente todos los filtros de negocio de alta calidad y foso defensivo.";
  } else if (score >= 4) {
    verdict = "Calidad Sólida";
    verdictDescription = "Negocio sólido y rentable con fundamentos financieros estables.";
  } else if (score <= 2) {
    verdict = "Precaución Fundamental";
    verdictDescription = "Muestra debilidades en rentabilidad sobre capital, apalancamiento o flujo de caja.";
  }

  return {
    score,
    maxScore,
    verdict,
    verdictDescription,
    items,
  };
}
