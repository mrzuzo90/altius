import { getCacheStore, TTL } from "@/lib/cache/store";
import { fetchWithTimeout } from "@/lib/http";
import type { CompanyFacts, XbrlFact } from "@/lib/sec/types";
import type { EsefCompany } from "@/lib/esef/companies";

const BASE = "https://query2.finance.yahoo.com";

type YahooObservation = {
  asOfDate?: string;
  periodType?: string;
  currencyCode?: string;
  reportedValue?: { raw?: number | null };
};

type YahooSeries = Record<string, unknown>;
type YahooTimeseriesResponse = {
  timeseries?: { result?: YahooSeries[]; error?: unknown };
};
type CachedYahooResponse = { payload: YahooTimeseriesResponse; retrievedAt: string };

type MetricMapping = {
  type: string;
  concepts: string[];
  kind: "duration" | "instant";
  unit: "currency" | "perShare" | "shares";
  page: "financials" | "balance-sheet" | "cash-flow";
  absoluteValue?: boolean;
};

/**
 * Yahoo normaliza estas partidas para cotizaciones globales. Se convierten a
 * conceptos IFRS conocidos por el motor de Altius, sin reemplazar nunca un
 * ejercicio que ya exista en ESEF.
 */
const METRICS: MetricMapping[] = [
  { type: "annualTotalRevenue", concepts: ["Revenue"], kind: "duration", unit: "currency", page: "financials" },
  { type: "annualCostOfRevenue", concepts: ["CostOfRevenue"], kind: "duration", unit: "currency", page: "financials" },
  { type: "annualGrossProfit", concepts: ["GrossProfit"], kind: "duration", unit: "currency", page: "financials" },
  { type: "annualResearchAndDevelopment", concepts: ["ResearchAndDevelopmentExpense"], kind: "duration", unit: "currency", page: "financials" },
  { type: "annualSellingGeneralAndAdministration", concepts: ["SellingGeneralAndAdministrativeExpense"], kind: "duration", unit: "currency", page: "financials" },
  { type: "annualOperatingExpense", concepts: ["OperatingExpenses"], kind: "duration", unit: "currency", page: "financials" },
  { type: "annualOperatingIncome", concepts: ["OperatingIncomeLoss"], kind: "duration", unit: "currency", page: "financials" },
  { type: "annualInterestExpenseNonOperating", concepts: ["InterestExpenseNonoperating"], kind: "duration", unit: "currency", page: "financials" },
  { type: "annualOtherNonOperatingIncomeExpenses", concepts: ["OtherNonoperatingIncomeExpense"], kind: "duration", unit: "currency", page: "financials" },
  { type: "annualPretaxIncome", concepts: ["ProfitLossBeforeTax"], kind: "duration", unit: "currency", page: "financials" },
  { type: "annualTaxProvision", concepts: ["IncomeTaxExpenseBenefit"], kind: "duration", unit: "currency", page: "financials" },
  { type: "annualNetIncome", concepts: ["ProfitLossAttributableToOwnersOfParent", "ProfitLoss"], kind: "duration", unit: "currency", page: "financials" },
  { type: "annualBasicEPS", concepts: ["BasicEarningsLossPerShare"], kind: "duration", unit: "perShare", page: "financials" },
  { type: "annualDilutedEPS", concepts: ["DilutedEarningsLossPerShare"], kind: "duration", unit: "perShare", page: "financials" },
  { type: "annualDilutedAverageShares", concepts: ["AdjustedWeightedAverageShares"], kind: "duration", unit: "shares", page: "financials" },

  { type: "annualCashAndCashEquivalents", concepts: ["CashAndCashEquivalentsAtCarryingValue"], kind: "instant", unit: "currency", page: "balance-sheet" },
  { type: "annualOtherShortTermInvestments", concepts: ["OtherShortTermInvestments"], kind: "instant", unit: "currency", page: "balance-sheet" },
  { type: "annualAccountsReceivable", concepts: ["AccountsReceivableNetCurrent"], kind: "instant", unit: "currency", page: "balance-sheet" },
  { type: "annualInventory", concepts: ["InventoryNet"], kind: "instant", unit: "currency", page: "balance-sheet" },
  { type: "annualCurrentAssets", concepts: ["AssetsCurrent"], kind: "instant", unit: "currency", page: "balance-sheet" },
  { type: "annualNetPPE", concepts: ["PropertyPlantAndEquipmentNet"], kind: "instant", unit: "currency", page: "balance-sheet" },
  { type: "annualGoodwill", concepts: ["Goodwill"], kind: "instant", unit: "currency", page: "balance-sheet" },
  { type: "annualOtherIntangibleAssets", concepts: ["IntangibleAssetsNetExcludingGoodwill"], kind: "instant", unit: "currency", page: "balance-sheet" },
  { type: "annualTotalAssets", concepts: ["Assets", "LiabilitiesAndStockholdersEquity"], kind: "instant", unit: "currency", page: "balance-sheet" },
  { type: "annualAccountsPayable", concepts: ["AccountsPayableCurrent"], kind: "instant", unit: "currency", page: "balance-sheet" },
  { type: "annualCurrentDebt", concepts: ["DebtCurrent"], kind: "instant", unit: "currency", page: "balance-sheet" },
  { type: "annualCurrentLiabilities", concepts: ["LiabilitiesCurrent"], kind: "instant", unit: "currency", page: "balance-sheet" },
  { type: "annualLongTermDebt", concepts: ["LongTermDebtNoncurrent"], kind: "instant", unit: "currency", page: "balance-sheet" },
  { type: "annualTotalLiabilitiesNetMinorityInterest", concepts: ["Liabilities"], kind: "instant", unit: "currency", page: "balance-sheet" },
  { type: "annualStockholdersEquity", concepts: ["StockholdersEquity"], kind: "instant", unit: "currency", page: "balance-sheet" },
  { type: "annualMinorityInterest", concepts: ["MinorityInterest"], kind: "instant", unit: "currency", page: "balance-sheet" },
  { type: "annualTotalEquityGrossMinorityInterest", concepts: ["StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"], kind: "instant", unit: "currency", page: "balance-sheet" },

  { type: "annualDepreciationAndAmortization", concepts: ["DepreciationAndAmortization"], kind: "duration", unit: "currency", page: "cash-flow" },
  { type: "annualStockBasedCompensation", concepts: ["ShareBasedCompensation"], kind: "duration", unit: "currency", page: "cash-flow" },
  { type: "annualOperatingCashFlow", concepts: ["NetCashProvidedByUsedInOperatingActivities"], kind: "duration", unit: "currency", page: "cash-flow" },
  { type: "annualCapitalExpenditure", concepts: ["PaymentsToAcquirePropertyPlantAndEquipment"], kind: "duration", unit: "currency", page: "cash-flow", absoluteValue: true },
  { type: "annualInvestingCashFlow", concepts: ["NetCashProvidedByUsedInInvestingActivities"], kind: "duration", unit: "currency", page: "cash-flow" },
  { type: "annualCashDividendsPaid", concepts: ["PaymentsOfDividends"], kind: "duration", unit: "currency", page: "cash-flow", absoluteValue: true },
  { type: "annualRepurchaseOfCapitalStock", concepts: ["PaymentsForRepurchaseOfCommonStock"], kind: "duration", unit: "currency", page: "cash-flow", absoluteValue: true },
  { type: "annualFinancingCashFlow", concepts: ["NetCashProvidedByUsedInFinancingActivities"], kind: "duration", unit: "currency", page: "cash-flow" },
];

export type YahooAnnualFacts = {
  facts: CompanyFacts;
  latestPeriodEnd: string;
  retrievedAt: string;
  sourceUrl: string;
};

function previousFiscalYearStart(end: string): string {
  const date = new Date(`${end}T00:00:00Z`);
  date.setUTCFullYear(date.getUTCFullYear() - 1);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function normalizedUnit(mapping: MetricMapping, currency: string | undefined): string | null {
  if (mapping.unit === "shares") return "shares";
  if (!currency || !/^[A-Z]{3}$/.test(currency)) return null;
  return mapping.unit === "perShare" ? `${currency}/shares` : currency;
}

function observationsFor(series: YahooSeries, type: string): YahooObservation[] {
  const value = series[type];
  return Array.isArray(value) ? value as YahooObservation[] : [];
}

function addFact(
  facts: CompanyFacts,
  concept: string,
  unit: string,
  fact: XbrlFact,
): void {
  const namespace = facts.facts["ifrs-full"] ??= {};
  const record = namespace[concept] ??= { units: {} };
  (record.units[unit] ??= []).push(fact);
}

/** Convierte la respuesta de Yahoo a hechos que entiende el normalizador XBRL. */
export function yahooTimeseriesToCompanyFacts(
  payload: YahooTimeseriesResponse,
  company: EsefCompany,
  afterPeriodEnd: string,
  retrievedAt: string,
): YahooAnnualFacts | null {
  const facts: CompanyFacts = { cik: 0, entityName: company.name, facts: {} };
  let latestPeriodEnd = "";

  for (const mapping of METRICS) {
    const series = payload.timeseries?.result?.find((candidate) => observationsFor(candidate, mapping.type).length > 0);
    if (!series) continue;
    for (const observation of observationsFor(series, mapping.type)) {
      const end = observation.asOfDate;
      const raw = observation.reportedValue?.raw;
      if (!end || end <= afterPeriodEnd || observation.periodType !== "12M" || typeof raw !== "number" || !Number.isFinite(raw)) continue;
      const unit = normalizedUnit(mapping, observation.currencyCode?.toUpperCase());
      if (!unit) continue;
      const sourceUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(company.ticker)}/${mapping.page}/`;
      const fact: XbrlFact = {
        ...(mapping.kind === "duration" ? { start: previousFiscalYearStart(end) } : {}),
        end,
        val: mapping.absoluteValue ? Math.abs(raw) : raw,
        accn: `YF-${company.ticker}-${end}-${mapping.type}`,
        form: "YAHOO-ANNUAL",
        filed: retrievedAt,
        sourceUrl,
        sourceLabel: "Yahoo Finance · último ejercicio",
      };
      for (const concept of mapping.concepts) addFact(facts, concept, unit, fact);
      if (end > latestPeriodEnd) latestPeriodEnd = end;
    }
  }

  if (!latestPeriodEnd) return null;
  return {
    facts,
    latestPeriodEnd,
    retrievedAt,
    sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(company.ticker)}/financials/`,
  };
}

export async function fetchYahooAnnualFacts(
  company: EsefCompany,
  afterPeriodEnd: string,
): Promise<YahooAnnualFacts | null> {
  const cache = getCacheStore();
  const cacheKey = `yahoo:annual-fundamentals:v2:${company.ticker}`;
  const cached = await cache.get<CachedYahooResponse>(cacheKey);
  let payload = cached?.payload ?? null;
  let retrievedAt = cached?.retrievedAt ?? new Date().toISOString().slice(0, 10);

  if (!payload) {
    const nowSeconds = Math.floor(Date.now() / 1_000);
    const period1 = nowSeconds - 60 * 60 * 24 * 365 * 6;
    const period2 = nowSeconds + 60 * 60 * 24 * 370;
    const types = METRICS.map((metric) => metric.type).join(",");
    const url = `${BASE}/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(company.ticker)}`
      + `?symbol=${encodeURIComponent(company.ticker)}&type=${encodeURIComponent(types)}&period1=${period1}&period2=${period2}`;
    try {
      const response = await fetchWithTimeout(url, {
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 Altius financial research" },
        cache: "no-store",
      }, 20_000);
      if (!response.ok) return null;
      payload = await response.json() as YahooTimeseriesResponse;
      retrievedAt = new Date().toISOString().slice(0, 10);
      await cache.set(cacheKey, { payload, retrievedAt }, TTL.companyFacts);
    } catch {
      return null;
    }
  }

  return yahooTimeseriesToCompanyFacts(payload, company, afterPeriodEnd, retrievedAt);
}
