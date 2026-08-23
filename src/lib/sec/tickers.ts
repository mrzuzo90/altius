import { padCik, secFetchJson } from "./client";
import { TTL } from "@/lib/cache/store";

const TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";

export type TickerHit = { ticker: string; cik: string; name: string };

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

/**
 * Puntuación de relevancia. La coincidencia exacta de ticker gana siempre:
 * quien teclea "AAP" busca AAP, no AAPL.
 */
function score(hit: TickerHit, q: string): number {
  const ticker = hit.ticker.toLowerCase();
  const name = hit.name.toLowerCase();
  if (ticker === q) return 100;
  if (ticker.startsWith(q)) return 60 - ticker.length;
  if (name.startsWith(q)) return 40;
  if (name.includes(q)) return 20;
  if (ticker.includes(q)) return 10;
  return 0;
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
    const s = score(hit, q);
    if (s > 0) scored.push({ hit, s });
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

function loadIndex(): Promise<RawTickerFile> {
  return secFetchJson<RawTickerFile>(TICKERS_URL, TTL.tickerIndex);
}

export async function searchTickers(query: string, limit = 10): Promise<TickerHit[]> {
  return rankTickers(await loadIndex(), query, limit);
}

/** Resuelve un ticker o nombre exacto a su CIK. */
export async function resolveTicker(tickerOrName: string): Promise<TickerHit | null> {
  const rawInput = tickerOrName.trim().toUpperCase();
  if (!rawInput) return null;

  const normalizedKey = rawInput.replace(/[\^/_\- .]/g, "");
  const aliasResolved =
    GLOBAL_COMPANY_ALIASES[rawInput] ??
    GLOBAL_COMPANY_ALIASES[normalizedKey] ??
    rawInput;

  const raw = await loadIndex();

  // 1. Coincidencia exacta por ticker resuelto o directo
  for (const entry of Object.values(raw)) {
    if (entry.ticker.toUpperCase() === aliasResolved || entry.ticker.toUpperCase() === rawInput) {
      return { ticker: entry.ticker, cik: padCik(entry.cik_str), name: entry.title };
    }
  }

  // 2. Coincidencia por búsqueda de nombre en el índice oficial de la SEC
  const ranked = rankTickers(raw, rawInput, 1);
  if (ranked.length > 0) {
    return ranked[0];
  }

  return null;
}
