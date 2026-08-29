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
export type LineUnit = "USD" | "shares" | "USD/shares" | "pure" | "percent";

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
  computed?: "grossProfit" | "freeCashFlow" | "ratio";
};

export const INCOME_STATEMENT: LineDef[] = [
  { id: "revenue", label: "Ingresos", kind: "duration", unit: "USD", emphasis: "total",
    concepts: ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet",
               "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueGoodsNet",
               "Revenue", "RevenueFromContractsWithCustomers"] },
  { id: "costOfRevenue", label: "Coste de ventas", kind: "duration", unit: "USD", indent: 1,
    concepts: ["CostOfRevenue", "CostOfGoodsAndServicesSold", "CostOfGoodsSold", "CostOfServices", "CostOfSales"] },
  { id: "grossProfit", label: "Beneficio bruto", kind: "duration", unit: "USD", emphasis: "subtotal",
    computed: "grossProfit", concepts: ["GrossProfit"] },
  // El orden importa y no es el intuitivo. JNJ usa la variante "Excluding" para
  // su I+D operativa (17.232 M$ en 2024) y reserva ResearchAndDevelopmentExpense
  // para cargos por I+D adquirida (1.841 M$). Con el orden inverso, la tabla
  // mostraba 109 M$ de I+D para una farmacéutica que gasta unos 17.000.
  { id: "researchAndDevelopment", label: "Investigación y desarrollo", kind: "duration", unit: "USD", indent: 1,
    concepts: ["ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost",
               "ResearchAndDevelopmentExpense"] },
  { id: "sellingGeneralAdmin", label: "Gastos generales, comerciales y administrativos", kind: "duration", unit: "USD", indent: 1,
    concepts: ["SellingGeneralAndAdministrativeExpense", "GeneralAndAdministrativeExpense"] },
  { id: "operatingExpenses", label: "Total gastos de explotación", kind: "duration", unit: "USD", emphasis: "subtotal",
    concepts: ["OperatingExpenses", "CostsAndExpenses", "DistributionCosts", "AdministrativeExpense"] },
  { id: "operatingIncome", label: "Resultado de explotación", kind: "duration", unit: "USD", emphasis: "subtotal",
    concepts: ["OperatingIncomeLoss", "ProfitLossFromOperatingActivities"] },
  // InterestExpenseNonoperating es la etiqueta moderna de la línea de la cuenta
  // de resultados: en Tesla coincide al céntimo con InterestExpense donde ambas
  // existen (191 y 156 M$) y es la única que continúa después. InterestExpense
  // queda de reserva para quien, como Apple, no usa la variante nonoperating.
  { id: "interestExpense", label: "Gasto financiero", kind: "duration", unit: "USD", indent: 1,
    concepts: ["InterestExpenseNonoperating", "InterestExpense", "InterestIncomeExpenseNet", "FinanceCosts"] },
  { id: "otherNonOperating", label: "Otros resultados no de explotación", kind: "duration", unit: "USD", indent: 1,
    concepts: ["NonoperatingIncomeExpense", "OtherNonoperatingIncomeExpense", "OtherIncomeExpenseFromSubsidiariesJointlyControlledEntitiesAndAssociates"] },
  { id: "pretaxIncome", label: "Resultado antes de impuestos", kind: "duration", unit: "USD", emphasis: "subtotal",
    concepts: ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest",
               "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments",
               "ProfitLossBeforeTax"] },
  { id: "incomeTax", label: "Impuesto sobre beneficios", kind: "duration", unit: "USD", indent: 1,
    concepts: ["IncomeTaxExpenseBenefit", "IncomeTaxExpenseContinuingOperations"] },
  { id: "netIncome", label: "Resultado neto", kind: "duration", unit: "USD", emphasis: "total",
    concepts: ["NetIncomeLoss", "ProfitLossAttributableToOwnersOfParent", "ProfitLoss"] },
  { id: "epsBasic", label: "BPA básico", kind: "duration", unit: "USD/shares",
    concepts: ["EarningsPerShareBasic", "EarningsPerShareBasicAndDiluted", "BasicEarningsLossPerShare"] },
  { id: "epsDiluted", label: "BPA diluido", kind: "duration", unit: "USD/shares",
    concepts: ["EarningsPerShareDiluted", "EarningsPerShareBasicAndDiluted", "DilutedEarningsLossPerShare", "BasicAndDilutedEarningsLossPerShare"] },
  { id: "sharesDiluted", label: "Acciones diluidas medias", kind: "duration", unit: "shares",
    concepts: ["WeightedAverageNumberOfDilutedSharesOutstanding", "AdjustedWeightedAverageShares", "WeightedAverageShares"] },
];

export const BALANCE_SHEET: LineDef[] = [
  { id: "cash", label: "Efectivo y equivalentes", kind: "instant", unit: "USD", indent: 1,
    concepts: ["CashAndCashEquivalentsAtCarryingValue",
               "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents", "CashAndCashEquivalents"] },
  { id: "shortTermInvestments", label: "Inversiones a corto plazo", kind: "instant", unit: "USD", indent: 1,
    concepts: ["MarketableSecuritiesCurrent", "AvailableForSaleSecuritiesDebtSecuritiesCurrent",
               "DebtSecuritiesCurrent", "ShortTermInvestments", "ShorttermInvestments",
               "OtherShortTermInvestments"] },
  { id: "cashAndShortTermInvestments", label: "Efectivo e inversiones a corto plazo", kind: "instant", unit: "USD", emphasis: "subtotal",
    concepts: ["CashCashEquivalentsAndShortTermInvestments"] },
  { id: "receivables", label: "Deudores comerciales", kind: "instant", unit: "USD", indent: 1,
    concepts: ["AccountsReceivableNetCurrent", "ReceivablesNetCurrent", "TradeAndOtherCurrentReceivables"] },
  { id: "inventory", label: "Existencias", kind: "instant", unit: "USD", indent: 1,
    concepts: ["InventoryNet", "Inventories"] },
  { id: "currentAssets", label: "Activo corriente", kind: "instant", unit: "USD", emphasis: "subtotal",
    concepts: ["AssetsCurrent", "CurrentAssets"] },
  { id: "ppe", label: "Inmovilizado material neto", kind: "instant", unit: "USD", indent: 1,
    concepts: ["PropertyPlantAndEquipmentNet", "PropertyPlantAndEquipment"] },
  { id: "goodwill", label: "Fondo de comercio", kind: "instant", unit: "USD", indent: 1,
    concepts: ["Goodwill"] },
  { id: "intangibles", label: "Otros intangibles", kind: "instant", unit: "USD", indent: 1,
    concepts: ["IntangibleAssetsNetExcludingGoodwill", "FiniteLivedIntangibleAssetsNet", "IntangibleAssetsOtherThanGoodwill"] },
  { id: "totalAssets", label: "Total activo", kind: "instant", unit: "USD", emphasis: "total",
    concepts: ["Assets"] },
  { id: "accountsPayable", label: "Acreedores comerciales", kind: "instant", unit: "USD", indent: 1,
    concepts: ["AccountsPayableCurrent", "TradeAndOtherCurrentPayables"] },
  { id: "shortTermDebt", label: "Deuda a corto plazo", kind: "instant", unit: "USD", indent: 1,
    concepts: ["ShortTermBorrowings", "ShorttermBorrowings", "DebtCurrent", "CommercialPaper",
               "LinesOfCreditCurrent", "CurrentBorrowings", "CurrentPortionOfNoncurrentBorrowings",
               "CurrentPortionOfLongtermBorrowings", "CurrentBorrowingsAndCurrentPortionOfNoncurrentBorrowings",
               "LongTermDebtAndCapitalLeaseObligationsCurrent", "LongTermDebtCurrent"] },
  { id: "currentLiabilities", label: "Pasivo corriente", kind: "instant", unit: "USD", emphasis: "subtotal",
    concepts: ["LiabilitiesCurrent", "CurrentLiabilities"] },
  { id: "longTermDebt", label: "Deuda a largo plazo", kind: "instant", unit: "USD", indent: 1,
    concepts: ["LongTermDebtNoncurrent", "LongtermBorrowings", "NoncurrentBorrowings", "LongTermDebt"] },
  { id: "totalDebt", label: "Deuda financiera total", kind: "instant", unit: "USD", emphasis: "subtotal",
    concepts: ["Borrowings", "LongTermDebt"] },
  { id: "netDebt", label: "Deuda financiera neta", kind: "instant", unit: "USD", emphasis: "subtotal",
    concepts: ["NetDebt"] },
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
    concepts: ["RetainedEarningsAccumulatedDeficit", "RetainedEarnings"] },
  { id: "equityParent", label: "Patrimonio de la dominante", kind: "instant", unit: "USD", indent: 1,
    concepts: ["StockholdersEquity", "EquityAttributableToOwnersOfParent"] },
  { id: "minorityInterest", label: "Intereses minoritarios", kind: "instant", unit: "USD", indent: 1,
    concepts: ["MinorityInterest", "NoncontrollingInterests"] },
  { id: "equity", label: "Patrimonio neto total", kind: "instant", unit: "USD", emphasis: "total",
    concepts: ["StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest",
               "StockholdersEquity", "Equity"] },
  { id: "liabilitiesAndEquity", label: "Total pasivo y patrimonio neto", kind: "instant", unit: "USD", emphasis: "total",
    concepts: ["LiabilitiesAndStockholdersEquity", "EquityAndLiabilities"] },
  { id: "sharesOutstanding", label: "Acciones en circulación", kind: "instant", unit: "shares", indent: 1,
    concepts: ["CommonStockSharesOutstanding", "NumberOfSharesOutstanding"] },
];

export const CASH_FLOW: LineDef[] = [
  { id: "cfNetIncome", label: "Resultado neto", kind: "duration", unit: "USD", indent: 1,
    concepts: ["NetIncomeLoss", "ProfitLoss"] },
  { id: "depreciation", label: "Amortizaciones", kind: "duration", unit: "USD", indent: 1,
    concepts: ["DepreciationDepletionAndAmortization", "DepreciationAmortizationAndAccretionNet",
               "DepreciationAndAmortization", "Depreciation", "DepreciationAndAmortisationExpense",
               "AdjustmentsForDepreciationAndAmortisationExpense",
               "AdjustmentsForDepreciationAndAmortisationExpenseAndImpairmentLossReversalOfImpairmentLossRecognisedInProfitOrLoss"] },
  { id: "stockComp", label: "Retribución en acciones", kind: "duration", unit: "USD", indent: 1,
    concepts: ["ShareBasedCompensation", "AllocatedShareBasedCompensationExpense", "SharebasedPaymentExpense"] },
  { id: "operatingCashFlow", label: "Flujo de caja de explotación", kind: "duration", unit: "USD", emphasis: "total",
    concepts: ["NetCashProvidedByUsedInOperatingActivities",
               "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations", "CashFlowsFromUsedInOperatingActivities"] },
  { id: "capex", label: "Inversión en inmovilizado", kind: "duration", unit: "USD", negate: true, indent: 1,
    concepts: ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets",
               "PurchaseOfPropertyPlantAndEquipment", "PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities",
               "PurchaseOfPropertyPlantAndEquipmentIntangibleAssetsOtherThanGoodwillInvestmentPropertyAndOtherNoncurrentAssets"] },
  { id: "investingCashFlow", label: "Flujo de caja de inversión", kind: "duration", unit: "USD", emphasis: "total",
    concepts: ["NetCashProvidedByUsedInInvestingActivities",
               "NetCashProvidedByUsedInInvestingActivitiesContinuingOperations", "CashFlowsFromUsedInInvestingActivities"] },
  { id: "dividends", label: "Dividendos pagados", kind: "duration", unit: "USD", negate: true, indent: 1,
    concepts: ["PaymentsOfDividendsCommonStock", "PaymentsOfDividends", "DividendsPaid"] },
  { id: "buybacks", label: "Recompra de acciones", kind: "duration", unit: "USD", negate: true, indent: 1,
    concepts: ["PaymentsForRepurchaseOfCommonStock", "PaymentsToAcquireOrRedeemEntitysShares"] },
  { id: "financingCashFlow", label: "Flujo de caja de financiación", kind: "duration", unit: "USD", emphasis: "total",
    concepts: ["NetCashProvidedByUsedInFinancingActivities",
               "NetCashProvidedByUsedInFinancingActivitiesContinuingOperations", "CashFlowsFromUsedInFinancingActivities"] },
  { id: "freeCashFlow", label: "Flujo de caja libre", kind: "duration", unit: "USD", emphasis: "subtotal",
    computed: "freeCashFlow", concepts: [] },
];

export const RATIOS_STATEMENT: LineDef[] = [
  // Márgenes y rentabilidad operativa
  { id: "grossMargin", label: "Margen bruto", kind: "duration", unit: "percent", emphasis: "subtotal",
    computed: "ratio", concepts: [] },
  { id: "ebitda", label: "EBITDA", kind: "duration", unit: "USD", emphasis: "subtotal",
    computed: "ratio", concepts: [] },
  { id: "ebitdaMargin", label: "Margen EBITDA", kind: "duration", unit: "percent", indent: 1,
    computed: "ratio", concepts: [] },
  { id: "operatingMargin", label: "Margen operativo (EBIT)", kind: "duration", unit: "percent", indent: 1,
    computed: "ratio", concepts: [] },
  { id: "netMargin", label: "Margen neto", kind: "duration", unit: "percent", indent: 1,
    computed: "ratio", concepts: [] },
  { id: "fcfMargin", label: "Margen FCF", kind: "duration", unit: "percent", indent: 1,
    computed: "ratio", concepts: [] },

  // Retornos sobre capital
  { id: "roe", label: "Rentabilidad sobre patrimonio (ROE)", kind: "duration", unit: "percent", emphasis: "subtotal",
    computed: "ratio", concepts: [] },
  { id: "roa", label: "Rentabilidad sobre activos (ROA)", kind: "duration", unit: "percent", indent: 1,
    computed: "ratio", concepts: [] },
  { id: "roic", label: "Retorno sobre capital invertido (ROIC)", kind: "duration", unit: "percent", emphasis: "subtotal",
    computed: "ratio", concepts: [] },
  { id: "effectiveTaxRate", label: "Tipo impositivo efectivo", kind: "duration", unit: "percent", indent: 1,
    computed: "ratio", concepts: [] },

  // Eficiencia y dinámica de caja
  { id: "fcfConversion", label: "Conversión de EBITDA en FCF", kind: "duration", unit: "percent", indent: 1,
    computed: "ratio", concepts: [] },

  // Crecimiento interanual
  { id: "revenueGrowthYoY", label: "Crecimiento de ingresos YoY", kind: "duration", unit: "percent", emphasis: "subtotal",
    computed: "ratio", concepts: [] },
  { id: "epsGrowthYoY", label: "Crecimiento de BPA diluido YoY", kind: "duration", unit: "percent", indent: 1,
    computed: "ratio", concepts: [] },
  { id: "fcfGrowthYoY", label: "Crecimiento de FCF YoY", kind: "duration", unit: "percent", indent: 1,
    computed: "ratio", concepts: [] },
];

export const STATEMENTS = {
  income: { id: "income", label: "Cuenta de resultados", lines: INCOME_STATEMENT },
  balance: { id: "balance", label: "Balance de situación", lines: BALANCE_SHEET },
  cashflow: { id: "cashflow", label: "Flujo de caja", lines: CASH_FLOW },
} as const;

export type StatementId = keyof typeof STATEMENTS | "ratios";

/** Todos los conceptos referenciados, para pruebas y para acotar las descargas. */
export function allConcepts(): string[] {
  return [...new Set([...INCOME_STATEMENT, ...BALANCE_SHEET, ...CASH_FLOW].flatMap((l) => l.concepts))];
}
