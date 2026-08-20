import { padCik, secFetchJson } from "./client";
import { TTL } from "@/lib/cache/store";

const TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";

export type TickerHit = { ticker: string; cik: string; name: string };

/** Forma cruda del fichero de la SEC: objeto indexado por número, no array. */
type RawTickerFile = Record<string, { cik_str: number; ticker: string; title: string }>;

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
        // A igualdad de puntuación gana el nombre más corto: quien escribe
        // "apple" busca Apple Inc., no Apple iSports Group. Desempatar por
        // orden alfabético del ticker dejaba a Apple en segundo lugar.
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

/** Resuelve un ticker exacto a su CIK. Devuelve null si no está registrado en la SEC. */
export async function resolveTicker(ticker: string): Promise<TickerHit | null> {
  const wanted = ticker.trim().toUpperCase();
  if (!wanted) return null;
  const raw = await loadIndex();
  for (const entry of Object.values(raw)) {
    if (entry.ticker.toUpperCase() === wanted) {
      return { ticker: entry.ticker, cik: padCik(entry.cik_str), name: entry.title };
    }
  }
  return null;
}
