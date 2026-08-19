/**
 * Mapa de líneas de Altius a conceptos XBRL.
 *
 * Cada línea declara una lista ORDENADA de conceptos candidatos. La resolución
 * es **por periodo**, no por línea: para cada periodo se toma el valor del
 * primer candidato que tenga dato en ese periodo concreto.
 *
 * Esto importa. Apple etiquetó sus ingresos como `SalesRevenueNet` hasta 2018 y
 * como `RevenueFromContractWithCustomerExcludingAssessedTax` desde 2019. Si se
 * eligiera un único concepto para toda la serie, el histórico se cortaría en
 * 2019. Resolviendo por periodo, la serie queda completa y sin inventar nada.
 */

export type LineKind = "duration" | "instant";
export type LineUnit = "USD" | "shares" | "USD/shares" | "pure";

export type LineDef = {
  id: string;
  label: string;
  /** Conceptos us-gaap candidatos, de mayor a menor prioridad. */
  concepts: string[];
  kind: LineKind;
  unit: LineUnit;
  /** La SEC reporta las salidas de caja en positivo; aquí se muestran en negativo. */
  negate?: boolean;
  emphasis?: "total" | "subtotal";
  indent?: number;
  /** Línea calculada por Altius, no reportada. Se marca en la interfaz. */
  computed?: "grossProfit" | "freeCashFlow";
};

export const INCOME_STATEMENT: LineDef[] = [
  { id: "revenue", label: "Ingresos", kind: "duration", unit: "USD", emphasis: "total",
    concepts: ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet",
               "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueGoodsNet"] },
  { id: "costOfRevenue", label: "Coste de ventas", kind: "duration", unit: "USD", indent: 1,
    concepts: ["CostOfRevenue", "CostOfGoodsAndServicesSold", "CostOfGoodsSold", "CostOfServices"] },
  { id: "grossProfit", label: "Beneficio bruto", kind: "duration", unit: "USD", emphasis: "subtotal",
    computed: "grossProfit", concepts: ["GrossProfit"] },
  { id: "researchAndDevelopment", label: "Investigación y desarrollo", kind: "duration", unit: "USD", indent: 1,
    concepts: ["ResearchAndDevelopmentExpense",
               "ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost"] },
  { id: "sellingGeneralAdmin", label: "Gastos generales, comerciales y administrativos", kind: "duration", unit: "USD", indent: 1,
    concepts: ["SellingGeneralAndAdministrativeExpense", "GeneralAndAdministrativeExpense"] },
  { id: "operatingExpenses", label: "Total gastos de explotación", kind: "duration", unit: "USD", emphasis: "subtotal",
    concepts: ["OperatingExpenses", "CostsAndExpenses"] },
  { id: "operatingIncome", label: "Resultado de explotación", kind: "duration", unit: "USD", emphasis: "subtotal",
    concepts: ["OperatingIncomeLoss"] },
  { id: "interestExpense", label: "Gasto financiero", kind: "duration", unit: "USD", indent: 1,
    concepts: ["InterestExpense", "InterestExpenseNonoperating", "InterestIncomeExpenseNet"] },
  { id: "otherNonOperating", label: "Otros resultados no de explotación", kind: "duration", unit: "USD", indent: 1,
    concepts: ["NonoperatingIncomeExpense", "OtherNonoperatingIncomeExpense"] },
  { id: "pretaxIncome", label: "Resultado antes de impuestos", kind: "duration", unit: "USD", emphasis: "subtotal",
    concepts: ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest",
               "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments"] },
  { id: "incomeTax", label: "Impuesto sobre beneficios", kind: "duration", unit: "USD", indent: 1,
    concepts: ["IncomeTaxExpenseBenefit"] },
  { id: "netIncome", label: "Resultado neto", kind: "duration", unit: "USD", emphasis: "total",
    concepts: ["NetIncomeLoss", "ProfitLoss"] },
  { id: "epsBasic", label: "BPA básico", kind: "duration", unit: "USD/shares",
    concepts: ["EarningsPerShareBasic", "EarningsPerShareBasicAndDiluted"] },
  { id: "epsDiluted", label: "BPA diluido", kind: "duration", unit: "USD/shares",
    concepts: ["EarningsPerShareDiluted", "EarningsPerShareBasicAndDiluted"] },
  { id: "sharesDiluted", label: "Acciones diluidas medias", kind: "duration", unit: "shares",
    concepts: ["WeightedAverageNumberOfDilutedSharesOutstanding"] },
];

export const BALANCE_SHEET: LineDef[] = [
  { id: "cash", label: "Efectivo y equivalentes", kind: "instant", unit: "USD", indent: 1,
    concepts: ["CashAndCashEquivalentsAtCarryingValue",
               "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"] },
  { id: "shortTermInvestments", label: "Inversiones a corto plazo", kind: "instant", unit: "USD", indent: 1,
    concepts: ["MarketableSecuritiesCurrent", "AvailableForSaleSecuritiesDebtSecuritiesCurrent",
               "ShortTermInvestments", "OtherShortTermInvestments"] },
  { id: "receivables", label: "Deudores comerciales", kind: "instant", unit: "USD", indent: 1,
    concepts: ["AccountsReceivableNetCurrent", "ReceivablesNetCurrent"] },
  { id: "inventory", label: "Existencias", kind: "instant", unit: "USD", indent: 1,
    concepts: ["InventoryNet"] },
  { id: "currentAssets", label: "Activo corriente", kind: "instant", unit: "USD", emphasis: "subtotal",
    concepts: ["AssetsCurrent"] },
  { id: "ppe", label: "Inmovilizado material neto", kind: "instant", unit: "USD", indent: 1,
    concepts: ["PropertyPlantAndEquipmentNet"] },
  { id: "goodwill", label: "Fondo de comercio", kind: "instant", unit: "USD", indent: 1,
    concepts: ["Goodwill"] },
  { id: "intangibles", label: "Otros intangibles", kind: "instant", unit: "USD", indent: 1,
    concepts: ["IntangibleAssetsNetExcludingGoodwill", "FiniteLivedIntangibleAssetsNet"] },
  { id: "totalAssets", label: "Total activo", kind: "instant", unit: "USD", emphasis: "total",
    concepts: ["Assets"] },
  { id: "accountsPayable", label: "Acreedores comerciales", kind: "instant", unit: "USD", indent: 1,
    concepts: ["AccountsPayableCurrent"] },
  { id: "currentLiabilities", label: "Pasivo corriente", kind: "instant", unit: "USD", emphasis: "subtotal",
    concepts: ["LiabilitiesCurrent"] },
  { id: "longTermDebt", label: "Deuda a largo plazo", kind: "instant", unit: "USD", indent: 1,
    concepts: ["LongTermDebtNoncurrent", "LongTermDebt"] },
  { id: "totalLiabilities", label: "Total pasivo", kind: "instant", unit: "USD", emphasis: "total",
    concepts: ["Liabilities"] },
  // El patrimonio se desglosa para que el balance cuadre. Tesla, por ejemplo,
  // tiene minoritarios y participaciones rescatables: con solo StockholdersEquity
  // el activo no coincidía con pasivo más patrimonio por 975 millones.
  { id: "redeemableNci", label: "Participaciones rescatables", kind: "instant", unit: "USD", indent: 1,
    concepts: ["RedeemableNoncontrollingInterestEquityCarryingAmount",
               "TemporaryEquityCarryingAmountIncludingPortionAttributableToNoncontrollingInterests"] },
  // Bonos convertibles y similares clasificados como patrimonio temporal. Tesla
  // llevaba 51 millones aquí en 2020, y sin esta línea el balance no cerraba.
  { id: "temporaryEquityParent", label: "Patrimonio temporal de la dominante", kind: "instant", unit: "USD", indent: 1,
    concepts: ["TemporaryEquityCarryingAmountAttributableToParent"] },
  { id: "retainedEarnings", label: "Reservas acumuladas", kind: "instant", unit: "USD", indent: 1,
    concepts: ["RetainedEarningsAccumulatedDeficit"] },
  { id: "equityParent", label: "Patrimonio de la dominante", kind: "instant", unit: "USD", indent: 1,
    concepts: ["StockholdersEquity"] },
  { id: "minorityInterest", label: "Intereses minoritarios", kind: "instant", unit: "USD", indent: 1,
    concepts: ["MinorityInterest"] },
  { id: "equity", label: "Patrimonio neto total", kind: "instant", unit: "USD", emphasis: "total",
    concepts: ["StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest",
               "StockholdersEquity"] },
  { id: "liabilitiesAndEquity", label: "Total pasivo y patrimonio neto", kind: "instant", unit: "USD", emphasis: "total",
    concepts: ["LiabilitiesAndStockholdersEquity"] },
];

export const CASH_FLOW: LineDef[] = [
  { id: "cfNetIncome", label: "Resultado neto", kind: "duration", unit: "USD", indent: 1,
    concepts: ["NetIncomeLoss", "ProfitLoss"] },
  { id: "depreciation", label: "Amortizaciones", kind: "duration", unit: "USD", indent: 1,
    concepts: ["DepreciationDepletionAndAmortization", "DepreciationAmortizationAndAccretionNet",
               "DepreciationAndAmortization", "Depreciation"] },
  { id: "stockComp", label: "Retribución en acciones", kind: "duration", unit: "USD", indent: 1,
    concepts: ["ShareBasedCompensation", "AllocatedShareBasedCompensationExpense"] },
  { id: "operatingCashFlow", label: "Flujo de caja de explotación", kind: "duration", unit: "USD", emphasis: "total",
    concepts: ["NetCashProvidedByUsedInOperatingActivities",
               "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations"] },
  { id: "capex", label: "Inversión en inmovilizado", kind: "duration", unit: "USD", negate: true, indent: 1,
    concepts: ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets"] },
  { id: "investingCashFlow", label: "Flujo de caja de inversión", kind: "duration", unit: "USD", emphasis: "total",
    concepts: ["NetCashProvidedByUsedInInvestingActivities",
               "NetCashProvidedByUsedInInvestingActivitiesContinuingOperations"] },
  { id: "dividends", label: "Dividendos pagados", kind: "duration", unit: "USD", negate: true, indent: 1,
    concepts: ["PaymentsOfDividendsCommonStock", "PaymentsOfDividends"] },
  { id: "buybacks", label: "Recompra de acciones", kind: "duration", unit: "USD", negate: true, indent: 1,
    concepts: ["PaymentsForRepurchaseOfCommonStock"] },
  { id: "financingCashFlow", label: "Flujo de caja de financiación", kind: "duration", unit: "USD", emphasis: "total",
    concepts: ["NetCashProvidedByUsedInFinancingActivities",
               "NetCashProvidedByUsedInFinancingActivitiesContinuingOperations"] },
  { id: "freeCashFlow", label: "Flujo de caja libre", kind: "duration", unit: "USD", emphasis: "subtotal",
    computed: "freeCashFlow", concepts: [] },
];

export const STATEMENTS = {
  income: { id: "income", label: "Cuenta de resultados", lines: INCOME_STATEMENT },
  balance: { id: "balance", label: "Balance de situación", lines: BALANCE_SHEET },
  cashflow: { id: "cashflow", label: "Flujo de caja", lines: CASH_FLOW },
} as const;

export type StatementId = keyof typeof STATEMENTS;

/** Todos los conceptos referenciados, para pruebas y para acotar las descargas. */
export function allConcepts(): string[] {
  return [...new Set([...INCOME_STATEMENT, ...BALANCE_SHEET, ...CASH_FLOW].flatMap((l) => l.concepts))];
}
