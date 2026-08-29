import { getCacheStore, TTL } from "@/lib/cache/store";
import type { FinancialStatementProvider } from "@/lib/financials/provider";
import { fetchWithTimeout } from "@/lib/http";
import { normalizeStatement, type Frequency } from "@/lib/sec/normalize";
import { buildRatiosStatement } from "@/lib/sec/ratios";
import { STATEMENTS, type StatementId } from "@/lib/sec/taxonomy";
import type { StatementBlock, StatementBundle } from "@/lib/sec/statements";
import type { CompanyFacts, CompanyProfile, XbrlFact } from "@/lib/sec/types";
import type { EsefCompany } from "./companies";
import { fetchYahooAnnualFacts } from "@/lib/yahoo/fundamentals";

const BASE = "https://filings.xbrl.org";

type FilingAttributes = {
  json_url: string | null;
  report_url: string | null;
  package_url: string | null;
  period_end: string;
  date_added: string;
  country: string;
  fxo_id: string;
};

type FilingIndex = { data: Array<{ attributes: FilingAttributes }> };
type XbrlJson = {
  facts?: Record<string, {
    value?: string | number;
    dimensions?: Record<string, string> & { concept?: string; period?: string; unit?: string };
  }>;
};

async function cachedJson<T>(key: string, url: string, ttl = TTL.companyFacts): Promise<T> {
  const cache = getCacheStore();
  const cached = await cache.get<T>(key);
  if (cached) return cached;
  const response = await fetchWithTimeout(url, { headers: { Accept: "application/json" }, cache: "no-store" }, 30_000);
  if (!response.ok) throw new Error(`ESEF respondió ${response.status} para ${url}`);
  const payload = await response.json() as T;
  await cache.set(key, payload, ttl);
  return payload;
}

function isoDate(value: string): string {
  return value.slice(0, 10);
}

function previousDay(value: string): string {
  const date = new Date(`${isoDate(value)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function parsePeriod(period: string): { start?: string; end: string } | null {
  if (period.includes("/")) {
    const [start, exclusiveEnd] = period.split("/");
    if (!start || !exclusiveEnd) return null;
    return { start: isoDate(start), end: previousDay(exclusiveEnd) };
  }
  return period ? { end: isoDate(period) } : null;
}

function normalizeUnit(unit: string | undefined): string | null {
  if (!unit) return null;
  return unit
    .replace(/^iso4217:/, "")
    .replace(/xbrli:shares/g, "shares")
    .replace(/xbrli:pure/g, "pure");
}

export function xbrlJsonToCompanyFacts(
  payload: XbrlJson,
  company: EsefCompany,
  filing: FilingAttributes,
): CompanyFacts {
  const facts: CompanyFacts["facts"] = {};
  const sourceUrl = filing.report_url ? `${BASE}${filing.report_url}` : filing.package_url ? `${BASE}${filing.package_url}` : BASE;

  for (const fact of Object.values(payload.facts ?? {})) {
    const dimensions = fact.dimensions;
    if (!dimensions?.concept || !dimensions.period) continue;
    const extraDimensions = Object.keys(dimensions).filter((key) => !["concept", "entity", "period", "unit"].includes(key));
    if (extraDimensions.length > 0) continue;
    const value = typeof fact.value === "number" ? fact.value : Number(fact.value);
    if (!Number.isFinite(value)) continue;
    const parsedPeriod = parsePeriod(dimensions.period);
    const unit = normalizeUnit(dimensions.unit);
    if (!parsedPeriod || !unit) continue;
    const [namespace, concept] = dimensions.concept.split(":", 2);
    if (!namespace || !concept) continue;

    const record: XbrlFact = {
      ...parsedPeriod,
      val: value,
      accn: filing.fxo_id,
      form: "ESEF",
      filed: isoDate(filing.date_added),
      sourceUrl,
      sourceLabel: "informe ESEF",
    };
    const conceptRecord = facts[namespace] ??= {};
    const item = conceptRecord[concept] ??= { units: {} };
    (item.units[unit] ??= []).push(record);
  }

  return { cik: 0, entityName: company.name, facts };
}

async function filingsFor(company: EsefCompany): Promise<FilingAttributes[]> {
  const index = await cachedJson<FilingIndex>(
    `esef:index:${company.lei}`,
    `${BASE}/api/entities/${company.lei}/filings?sort=-period_end&page%5Bsize%5D=200`,
  );
  const filings = index.data
    .map((item) => item.attributes)
    .filter((item): item is FilingAttributes & { json_url: string } => Boolean(item.json_url))
    .filter((item, position, all) => all.findIndex((candidate) => candidate.fxo_id === item.fxo_id) === position)
    .slice(0, 30);
  if (filings.length === 0) throw new Error(`No hay xBRL-JSON ESEF para ${company.name}`);
  return filings;
}

export function mergeCompanyFacts(company: EsefCompany, reports: CompanyFacts[]): CompanyFacts {
  const merged: CompanyFacts = { cik: 0, entityName: company.name, facts: {} };
  for (const report of reports) {
    for (const [namespace, concepts] of Object.entries(report.facts)) {
      const targetNamespace = merged.facts[namespace] ??= {};
      for (const [concept, item] of Object.entries(concepts)) {
        const targetConcept = targetNamespace[concept] ??= { units: {} };
        for (const [unit, values] of Object.entries(item.units)) {
          (targetConcept.units[unit] ??= []).push(...values);
        }
      }
    }
  }
  return merged;
}

type LoadedEsefReport = { filing: FilingAttributes; facts: CompanyFacts };

/**
 * filings.xbrl.org puede cortar conexiones cuando se solicitan decenas de
 * paquetes grandes a la vez. Los informes se descargan en lotes moderados y
 * un documento antiguo defectuoso no invalida todos los ejercicios válidos.
 */
async function loadEsefReports(
  company: EsefCompany,
  filings: FilingAttributes[],
): Promise<LoadedEsefReport[]> {
  const loaded: LoadedEsefReport[] = [];
  const batchSize = 5;
  for (let start = 0; start < filings.length; start += batchSize) {
    const batch = filings.slice(start, start + batchSize);
    const results = await Promise.all(batch.map(async (filing): Promise<LoadedEsefReport | null> => {
      try {
        const payload = await cachedJson<XbrlJson>(
          `esef:facts:${filing.fxo_id}`,
          `${BASE}${filing.json_url}`,
          TTL.filingDocument,
        );
        return { filing, facts: xbrlJsonToCompanyFacts(payload, company, filing) };
      } catch {
        return null;
      }
    }));
    loaded.push(...results.filter((result): result is LoadedEsefReport => result !== null));
  }
  if (loaded.length === 0) throw new Error(`No se ha podido descargar ningún informe ESEF de ${company.name}`);
  return loaded;
}

export async function buildEsefStatements(company: EsefCompany, frequency: Frequency): Promise<StatementBundle> {
  if (frequency !== "annual") return emptyBundle(company, frequency);
  const filings = await filingsFor(company);
  const latestIndexedPeriod = filings[0].period_end;
  const [loadedReports, latestBridge] = await Promise.all([
    loadEsefReports(company, filings),
    fetchYahooAnnualFacts(company, latestIndexedPeriod),
  ]);
  const facts = mergeCompanyFacts(company, [
    ...loadedReports.map((report) => report.facts),
    ...(latestBridge ? [latestBridge.facts] : []),
  ]);
  const currency = detectCurrency(facts);

  const baseBlocks: StatementBlock[] = (Object.keys(STATEMENTS) as (keyof typeof STATEMENTS)[]).map((id) => {
    const definition = STATEMENTS[id];
    return { id, label: definition.label, ...normalizeStatement(facts, [...definition.lines], "annual", 30, currency) };
  });
  const income = baseBlocks.find((block) => block.id === "income")!;
  const balance = baseBlocks.find((block) => block.id === "balance")!;
  const cashflow = baseBlocks.find((block) => block.id === "cashflow")!;
  const ratios: StatementBlock = {
    id: "ratios" as StatementId,
    label: "Ratios y márgenes",
    ...buildRatiosStatement(income, balance, cashflow, "annual"),
  };
  const blocks = [...baseBlocks, ratios];
  const latestFiling = loadedReports[0].filing;
  const latestEsefSourceUrl = latestFiling.report_url
    ? `${BASE}${latestFiling.report_url}`
    : latestFiling.package_url
      ? `${BASE}${latestFiling.package_url}`
      : BASE;
  const latestSourceUrl = latestBridge?.sourceUrl ?? latestEsefSourceUrl;

  return {
    profile: getEsefCompanyProfile(company),
    frequency,
    blocks,
    latestPeriodEnd: blocks.flatMap((block) => block.periods.map((period) => period.end)).sort().at(-1) ?? null,
    currency,
    source: {
      label: latestBridge ? "ESEF + Yahoo Finance · último ejercicio" : "ESEF · filings.xbrl.org",
      detail: latestBridge
        ? `${loadedReports.length} informes anuales Inline XBRL consolidados. ESEF conserva el histórico oficial y Yahoo Finance completa únicamente el ejercicio ${latestBridge.latestPeriodEnd.slice(0, 4)}, todavía no indexado por filings.xbrl.org; cada cifra mantiene su procedencia.`
        : `${loadedReports.length} informes anuales Inline XBRL consolidados; cada cifra enlaza con su presentación ESEF.`,
      href: latestSourceUrl,
    },
    annualReport: latestFiling.report_url ? {
      label: "Informe anual ESEF",
      href: `${BASE}${latestFiling.report_url}`,
      form: "ESEF",
      periodEnd: latestFiling.period_end,
    } : undefined,
  };
}

function detectCurrency(facts: CompanyFacts): string {
  const counts = new Map<string, number>();
  for (const namespace of Object.values(facts.facts)) for (const concept of Object.values(namespace)) {
    for (const [unit, values] of Object.entries(concept.units)) if (/^[A-Z]{3}$/.test(unit)) {
      counts.set(unit, (counts.get(unit) ?? 0) + values.length);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "EUR";
}

export function getEsefCompanyProfile(company: EsefCompany): CompanyProfile {
  return {
    cik: "",
    lei: company.lei,
    name: company.name,
    tickers: [company.ticker],
    exchanges: [company.exchange],
    sic: "",
    sicDescription: company.industry ?? company.country,
    sector: company.sector,
    fiscalYearEnd: null,
    website: null,
    address: null,
    stateOfIncorporation: company.country,
  };
}

function emptyBundle(company: EsefCompany, frequency: Frequency): StatementBundle {
  return { profile: getEsefCompanyProfile(company), frequency, blocks: [], latestPeriodEnd: null, currency: "EUR", source: { label: "ESEF", detail: "ESEF solo publica estados anuales." } };
}

export const esefProvider: FinancialStatementProvider<EsefCompany> = {
  id: "esef",
  supports: (frequency) => frequency === "annual",
  build: buildEsefStatements,
};
