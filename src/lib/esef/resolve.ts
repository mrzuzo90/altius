import { getCacheStore, TTL } from "@/lib/cache/store";
import { fetchWithTimeout } from "@/lib/http";
import { ESEF_COMPANIES, resolveEsefCompany, type EsefCompany } from "./companies";

const EUROPEAN_SUFFIXES = [
  ".AS", ".AT", ".BR", ".CO", ".DE", ".F", ".HE", ".IC", ".IR", ".L",
  ".LS", ".MC", ".MI", ".OL", ".PA", ".PR", ".RG", ".ST", ".SW", ".TL",
  ".VI", ".VS", ".WA",
];

export type EuropeanSearchHit = {
  ticker: string;
  name: string;
  exchange: string;
  country: string;
  aliases?: string[];
};

type YahooSearch = {
  quotes?: Array<{
    symbol?: string;
    longname?: string;
    shortname?: string;
    exchange?: string;
    quoteType?: string;
    sector?: string;
    sectorDisp?: string;
    industry?: string;
    industryDisp?: string;
  }>;
};

type GleifResponse = {
  data?: Array<{
    attributes?: {
      lei?: string;
      entity?: {
        legalName?: { name?: string };
        legalAddress?: { country?: string };
        status?: string;
      };
      registration?: { status?: string };
    };
  }>;
};

type FilingCheck = {
  data?: Array<{ attributes?: { json_url?: string | null } }>;
};

async function cachedJson<T>(key: string, url: string, ttl = TTL.tickerIndex): Promise<T | null> {
  const cache = getCacheStore();
  const cached = await cache.get<T>(key);
  if (cached) return cached;
  try {
    const response = await fetchWithTimeout(url, {
      headers: { Accept: "application/json", "User-Agent": "Altius financial research" },
      cache: "no-store",
    }, 12_000);
    if (!response.ok) return null;
    const payload = await response.json() as T;
    await cache.set(key, payload, ttl);
    return payload;
  } catch {
    return null;
  }
}

function normalizedName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "")
    .toUpperCase();
}

function comparableLegalName(value: string): string {
  const legalForms = new Set([
    "AG", "BV", "CO", "COMPANY", "CORP", "CORPORATION", "GMBH", "GROUP", "HOLDING",
    "HOLDINGS", "INC", "LIMITED", "LTD", "NV", "OYJ", "PLC", "SA", "SAS", "SE", "SPA",
  ]);
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((token) => token && !legalForms.has(token))
    .join("");
}

function sameLegalEntityName(left: string, right: string): boolean {
  const normalizedLeft = normalizedName(left);
  const normalizedRight = normalizedName(right);
  if (normalizedLeft === normalizedRight) return true;
  const comparableLeft = comparableLegalName(left);
  const comparableRight = comparableLegalName(right);
  return comparableLeft.length >= 8 && comparableRight.length >= 8 && (
    comparableLeft === comparableRight ||
    comparableLeft.startsWith(comparableRight) ||
    comparableRight.startsWith(comparableLeft)
  );
}

function isEuropeanTicker(value: string): boolean {
  const symbol = value.toUpperCase();
  return EUROPEAN_SUFFIXES.some((suffix) => symbol.endsWith(suffix));
}

function isOrdinaryEuropeanEquity(quote: NonNullable<YahooSearch["quotes"]>[number]): boolean {
  if (quote.quoteType !== "EQUITY" || !quote.symbol || !isEuropeanTicker(quote.symbol)) return false;
  const baseTicker = quote.symbol.toUpperCase().split(".")[0];
  const name = `${quote.longname ?? ""} ${quote.shortname ?? ""}`;
  return /^[A-Z0-9-]{1,10}$/.test(baseTicker)
    && !/^[A-Z]{2}\d{8,}$/.test(baseTicker)
    && !/\b(TRACK|TURBO|WARRANT|CERTIFICATE|FACTOR|OPEN END)\b/i.test(name);
}

/**
 * Busca cotizaciones europeas por nombre o ticker. El catálogo verificado se
 * muestra primero y Yahoo se usa únicamente como índice de símbolos; los
 * estados financieros se validan después contra GLEIF + ESEF.
 */
export async function searchEsefCompanies(query: string, limit = 8): Promise<EuropeanSearchHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const needle = normalizedName(trimmed);
  const curated = ESEF_COMPANIES
    .filter((company) => [company.ticker, company.name, ...company.aliases]
      .some((value) => normalizedName(value).includes(needle)))
    .map((company) => ({
      ticker: company.ticker,
      name: company.name,
      exchange: company.exchange,
      country: company.country,
      aliases: company.aliases,
    }));

  const yahoo = await cachedJson<YahooSearch>(
    `esef:yahoo-search:${needle}`,
    `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(trimmed)}&quotesCount=12&newsCount=0`,
  );
  const yahooHits = (yahoo?.quotes ?? [])
    .filter(isOrdinaryEuropeanEquity)
    .map((quote) => ({
      ticker: quote.symbol!.toUpperCase(),
      name: quote.longname?.trim() || quote.shortname?.trim() || quote.symbol!,
      exchange: quote.exchange ?? "Mercado europeo",
      country: "Europa",
      aliases: [],
    }));

  const unique = new Map<string, EuropeanSearchHit>();
  for (const hit of [...curated, ...yahooHits]) {
    if (!unique.has(hit.ticker)) unique.set(hit.ticker, hit);
  }
  return [...unique.values()].slice(0, limit);
}

/**
 * Resuelve un ticker europeo sin mantener a mano un censo completo:
 * ticker de mercado → razón social → LEI → existencia de un filing ESEF.
 * Solo acepta coincidencias exactas de razón social para evitar asociar una
 * cotización a la filial o matriz equivocada.
 */
export async function resolveEsefCompanyDynamic(query: string): Promise<EsefCompany | null> {
  const curated = resolveEsefCompany(query);
  if (curated) return curated;

  const ticker = query.trim().toUpperCase();
  if (!isEuropeanTicker(ticker)) return null;

  const yahoo = await cachedJson<YahooSearch>(
    `esef:yahoo-identity:${ticker}`,
    `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&quotesCount=5&newsCount=0`,
  );
  const quote = yahoo?.quotes?.find((item) => item.quoteType === "EQUITY" && item.symbol?.toUpperCase() === ticker);
  const legalName = quote?.longname?.trim();
  if (!quote?.symbol || !legalName) return null;

  const params = new URLSearchParams({
    "filter[entity.legalName]": legalName,
    "page[size]": "10",
  });
  const gleif = await cachedJson<GleifResponse>(
    `esef:gleif:${normalizedName(legalName)}`,
    `https://api.gleif.org/api/v1/lei-records?${params.toString()}`,
    TTL.companyFacts,
  );
  const candidate = gleif?.data?.find((item) => {
    const attributes = item.attributes;
    return Boolean(
      attributes?.lei &&
      attributes.entity?.legalName?.name &&
      attributes.entity.status !== "INACTIVE" &&
      sameLegalEntityName(attributes.entity.legalName.name, legalName),
    );
  })?.attributes;
  if (!candidate?.lei) return null;

  const check = await cachedJson<FilingCheck>(
    `esef:filing-check:${candidate.lei}`,
    `https://filings.xbrl.org/api/entities/${candidate.lei}/filings?sort=-period_end&page%5Bsize%5D=5`,
    TTL.companyFacts,
  );
  if (!check?.data?.some((item) => item.attributes?.json_url)) return null;

  return {
    ticker: quote.symbol.toUpperCase(),
    name: candidate.entity?.legalName?.name ?? legalName,
    lei: candidate.lei,
    exchange: quote.exchange ?? "Mercado europeo",
    country: candidate.entity?.legalAddress?.country ?? "Europa",
    sector: quote.sectorDisp ?? quote.sector ?? "Sin clasificar",
    industry: quote.industryDisp ?? quote.industry,
    aliases: [ticker, legalName],
  };
}
