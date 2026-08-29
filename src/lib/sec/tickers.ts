import { padCik, secFetchJson } from "./client";
import { TTL } from "@/lib/cache/store";
import { normalizeSearchText, scoreSearchCandidate } from "@/lib/search/ranking";

const TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";

const LOCAL_MARKET_SUFFIXES = [
  // Europa
  ".AS", ".AT", ".BR", ".CO", ".DE", ".HE", ".IR", ".L", ".LS", ".MC",
  ".MI", ".OL", ".PA", ".PR", ".ST", ".SW", ".VI", ".WA",
  // Canadá y Australia; también mercados globales con emisores registrados en SEC.
  ".TO", ".V", ".CN", ".NE", ".AX", ".HK", ".T", ".SI", ".JO", ".NZ",
] as const;

export type TickerHit = { ticker: string; cik: string; name: string; matchedAlias?: string };

/** Forma cruda del fichero de la SEC: objeto indexado por número, no array. */
type RawTickerFile = Record<string, { cik_str: number; ticker: string; title: string }>;

/** Mapeo exhaustivo de alias de empresas europeas, globales y nombres comunes */
const GLOBAL_COMPANY_ALIASES: Record<string, string> = {
  // España
  INDITEX: "IDEXY",
  ITX: "IDEXY",
  "ITX.MC": "IDEXY",
  IDEXY: "IDEXY",
  SANTANDER: "SAN",
  "SAN.MC": "SAN",
  SAN: "SAN",
  BBVA: "BBVA",
  "BBVA.MC": "BBVA",
  IBERDROLA: "IBDRY",
  IBE: "IBDRY",
  "IBE.MC": "IBDRY",
  IBDRY: "IBDRY",
  TELEFONICA: "TEF",
  "TEF.MC": "TEF",
  TEF: "TEF",
  REPSOL: "REPYY",
  "REP.MC": "REPYY",
  REPYY: "REPYY",
  FERROVIAL: "FER",
  "FER.MC": "FER",
  GRIFOLS: "GRFS",
  "GRF.MC": "GRFS",

  // Europa
  LVMH: "LVMUY",
  MC: "LVMUY",
  "MC.PA": "LVMUY",
  LVMUY: "LVMUY",
  TOTAL: "TTE",
  TOTALENERGIES: "TTE",
  "TTE.PA": "TTE",
  TTE: "TTE",
  AIRBUS: "EADSY",
  "AIR.PA": "EADSY",
  EADSY: "EADSY",
  BAYER: "BAYRY",
  "BAYN.DE": "BAYRY",
  BAYRY: "BAYRY",
  BMW: "BMWYY",
  "BMW.DE": "BMWYY",
  BMWYY: "BMWYY",
  MERCEDES: "MBGAF",
  "MBG.DE": "MBGAF",
  MBGAF: "MBGAF",
  SAP: "SAP",
  "SAP.DE": "SAP",
  ASML: "ASML",
  "ASML.AS": "ASML",
  NOVO: "NVO",
  NOVONORDISK: "NVO",
  "NOVO NORDISK": "NVO",
  "NVO.CO": "NVO",
  NVO: "NVO",
  ASTRAZENECA: "AZN",
  "AZN.L": "AZN",
  AZN: "AZN",
  NESTLE: "NSRGY",
  "NESN.SW": "NSRGY",
  NSRGY: "NSRGY",
  ROCHE: "RHHBY",
  "ROG.SW": "RHHBY",
  RHHBY: "RHHBY",
  NOVARTIS: "NVS",
  "NOVN.SW": "NVS",
  NVS: "NVS",
  ALLIANZ: "ALIZY",
  "ALV.DE": "ALIZY",
  SIEMENS: "SIEGY",
  "SIE.DE": "SIEGY",
  LOREAL: "LRLCY",
  "OR.PA": "LRLCY",
  HERMES: "HESAY",
  "RMS.PA": "HESAY",
  SANOFI: "SNY",
  "SAN.PA": "SNY",
  SNY: "SNY",
  SCHNEIDER: "SBGSY",
  "SU.PA": "SBGSY",

  // EE. UU. / Global Tech & Compounders
  APPLE: "AAPL",
  TESLA: "TSLA",
  MICROSOFT: "MSFT",
  AMAZON: "AMZN",
  GOOGLE: "GOOGL",
  ALPHABET: "GOOGL",
  FACEBOOK: "META",
  NVIDIA: "NVDA",
  BERKSHIRE: "BRK.B",
  JPMORGAN: "JPM",
  NETFLIX: "NFLX",
  SPOTIFY: "SPOT",
};

const SEARCH_ALIASES_BY_TICKER = Object.entries(GLOBAL_COMPANY_ALIASES).reduce<Record<string, string[]>>(
  (aliases, [name, ticker]) => {
    (aliases[ticker] ??= []).push(name);
    return aliases;
  },
  {},
);

/**
 * Puntuación de relevancia. La coincidencia exacta de ticker gana siempre:
 * quien teclea "AAP" busca AAP, no AAPL.
 */
function score(hit: TickerHit, q: string): { score: number; matchedAlias?: string } {
  const aliases = SEARCH_ALIASES_BY_TICKER[hit.ticker.toUpperCase()] ?? [];
  const candidate = {
    id: hit.ticker,
    kind: "company" as const,
    symbol: hit.ticker,
    name: hit.name,
    href: "",
    meta: "",
  };
  const nativeScore = scoreSearchCandidate(candidate, q).score;
  const withAliases = scoreSearchCandidate({ ...candidate, aliases }, q).score;
  if (withAliases <= nativeScore) return { score: nativeScore };

  const normalizedQuery = normalizeSearchText(q);
  const matchedAlias = aliases.find((alias) => {
    const normalizedAlias = normalizeSearchText(alias);
    return normalizedAlias === normalizedQuery || normalizedAlias.startsWith(normalizedQuery);
  });
  return { score: withAliases, matchedAlias };
}

export function rankTickers(raw: RawTickerFile, query: string, limit = 10): TickerHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored: { hit: TickerHit; s: number }[] = [];
  for (const entry of Object.values(raw)) {
    const hit: TickerHit = {
      ticker: entry.ticker,
      cik: padCik(entry.cik_str),
      name: entry.title,
    };
    const ranked = score(hit, q);
    if (ranked.score > 0) {
      scored.push({
        hit: ranked.matchedAlias ? { ...hit, matchedAlias: ranked.matchedAlias } : hit,
        s: ranked.score,
      });
    }
  }

  return scored
    .sort(
      (a, b) =>
        b.s - a.s ||
        a.hit.name.length - b.hit.name.length ||
        a.hit.ticker.localeCompare(b.hit.ticker),
    )
    .slice(0, limit)
    .map((x) => x.hit);
}

let indexPromise: Promise<RawTickerFile> | null = null;

function loadIndex(): Promise<RawTickerFile> {
  indexPromise ??= secFetchJson<RawTickerFile>(TICKERS_URL, TTL.tickerIndex);
  return indexPromise.catch((error) => {
    indexPromise = null;
    throw error;
  });
}

export async function searchTickers(query: string, limit = 10): Promise<TickerHit[]> {
  return rankTickers(await loadIndex(), query, limit);
}

/** Resuelve un ticker o nombre exacto a su CIK. */
export async function resolveTicker(tickerOrName: string): Promise<TickerHit | null> {
  const rawInput = tickerOrName.trim().toUpperCase();
  if (!rawInput) return null;
  return resolveTickerFromIndex(await loadIndex(), rawInput);
}

/** Variante pura usada para impedir colisiones entre tickers locales y estadounidenses. */
export function resolveTickerFromIndex(raw: RawTickerFile, tickerOrName: string): TickerHit | null {
  const rawInput = tickerOrName.trim().toUpperCase();
  if (!rawInput) return null;

  const normalizedKey = rawInput.replace(/[\^/_\- .]/g, "");
  const explicitAlias = GLOBAL_COMPANY_ALIASES[rawInput] ?? GLOBAL_COMPANY_ALIASES[normalizedKey];
  const aliasResolved =
    explicitAlias ??
    rawInput;

  // 1. Coincidencia exacta por ticker resuelto o directo
  for (const entry of Object.values(raw)) {
    if (entry.ticker.toUpperCase() === aliasResolved || entry.ticker.toUpperCase() === rawInput) {
      const preserveLocalListing = rawInput.includes(".") && GLOBAL_COMPANY_ALIASES[rawInput] === aliasResolved;
      return { ticker: preserveLocalListing ? rawInput : entry.ticker, cik: padCik(entry.cik_str), name: entry.title };
    }
  }

  // 2. Una cotización local puede corresponder al mismo emisor que presenta
  // estados en la SEC (SHOP.TO → SHOP, BHP.AX → BHP, SHEL.L → SHEL). Se
  // conserva el ticker local para precio/divisa y solo se reutiliza el CIK.
  const localSuffix = LOCAL_MARKET_SUFFIXES.find((suffix) => rawInput.endsWith(suffix));
  const baseTicker = localSuffix ? rawInput.slice(0, -localSuffix.length) : null;
  if (baseTicker && !explicitAlias) {
    for (const entry of Object.values(raw)) {
      if (entry.ticker.toUpperCase() === baseTicker) {
        return { ticker: rawInput, cik: padCik(entry.cik_str), name: entry.title };
      }
    }
  }

  // 3. Coincidencia por búsqueda de nombre en el índice oficial de la SEC
  const ranked = rankTickers(raw, rawInput, 1);
  if (ranked.length > 0) {
    return ranked[0];
  }

  return null;
}
