export type SearchResultKind = "company" | "index" | "commodity" | "currency";

export type SearchCandidate = {
  id: string;
  kind: SearchResultKind;
  symbol: string;
  name: string;
  shortName?: string;
  aliases?: string[];
  href: string;
  meta: string;
};

export type RankedSearchResult = SearchCandidate & {
  score: number;
  match: "exact" | "alias" | "prefix" | "partial" | "fuzzy";
};

const LEGAL_SUFFIXES = new Set([
  "AG",
  "BV",
  "CO",
  "COMPANY",
  "CORP",
  "CORPORATION",
  "GMBH",
  "GROUP",
  "HOLDING",
  "HOLDINGS",
  "INC",
  "INCORPORATED",
  "LIMITED",
  "LLC",
  "LTD",
  "NV",
  "OYJ",
  "PLC",
  "SA",
  "SAS",
  "SE",
  "SPA",
]);

/**
 * Desempate ligero para que, entre coincidencias del mismo nivel, las empresas
 * que un inversor suele buscar primero no queden debajo de sociedades homónimas.
 * Nunca puede superar una coincidencia exacta de otra entidad.
 */
const COMPANY_PROMINENCE: Record<string, number> = {
  AAPL: 40,
  MSFT: 39,
  NVDA: 38,
  AMZN: 37,
  GOOGL: 36,
  GOOG: 35,
  META: 34,
  TSLA: 33,
  BRK_B: 32,
  JPM: 31,
  V: 30,
  MA: 29,
  LLY: 28,
  AVGO: 27,
  WMT: 26,
  ASML: 25,
  ASML_AS: 25,
  LVMUY: 24,
  MC_PA: 24,
  NVO: 23,
  SAP: 22,
  TSM: 21,
  NFLX: 20,
  COST: 19,
  ORCL: 18,
  AMD: 17,
  INTC: 16,
  DIS: 15,
  KO: 14,
  PEP: 13,
  JNJ: 12,
};

const KIND_INTENT: Record<SearchResultKind, string[]> = {
  company: ["accion", "acciones", "empresa", "empresas", "cotizada", "stock"],
  index: ["indice", "indices", "index", "bolsa"],
  commodity: ["commodity", "commodities", "materia prima", "materias primas"],
  currency: ["divisa", "divisas", "forex", "tipo de cambio", "moneda"],
};

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " AND ")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

/** Quita palabras de contexto para admitir búsquedas naturales como
 * "empresa Apple" o "índice DAX" sin perder la intención de activo. */
export function coreSearchQuery(value: string): string {
  const normalized = normalizeSearchText(value);
  const intentTerms = Object.values(KIND_INTENT)
    .flat()
    .map(normalizeSearchText)
    .sort((left, right) => right.length - left.length);
  let core = ` ${normalized} `;
  for (const term of intentTerms) core = core.replace(` ${term} `, " ");
  core = core.trim().replace(/\s+/g, " ");
  return core || normalized;
}

function compact(value: string): string {
  return normalizeSearchText(value).replace(/\s/g, "");
}

function plainCompanyName(value: string): string {
  const words = normalizeSearchText(value).split(" ").filter(Boolean);
  while (words.length > 1 && LEGAL_SUFFIXES.has(words.at(-1)!)) words.pop();
  if (words.length > 2 && words.at(-2) === "S" && words.at(-1) === "A") words.splice(-2);
  return words.join(" ");
}

function editDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function fuzzyScore(query: string, values: string[]): number {
  if (query.length < 4) return 0;
  const tolerance = query.length >= 8 ? 2 : 1;
  for (const value of values) {
    for (const word of normalizeSearchText(value).split(" ")) {
      if (Math.abs(word.length - query.length) <= tolerance && editDistance(word, query) <= tolerance) {
        return 4_000;
      }
    }
  }
  return 0;
}

function kindIntentBoost(kind: SearchResultKind, normalizedQuery: string): number {
  const intendedKind = (Object.entries(KIND_INTENT) as Array<[SearchResultKind, string[]]>).find(
    ([, terms]) => terms.some((term) =>
      ` ${normalizedQuery} `.includes(` ${normalizeSearchText(term)} `),
    ),
  )?.[0];
  if (intendedKind) return intendedKind === kind ? 900 : 0;
  return kind === "company" ? 45 : 0;
}

function prominence(candidate: SearchCandidate): number {
  if (candidate.kind !== "company") return 0;
  const key = candidate.symbol.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  return COMPANY_PROMINENCE[key] ?? 0;
}

export function scoreSearchCandidate(
  candidate: SearchCandidate,
  query: string,
): Pick<RankedSearchResult, "score" | "match"> {
  const fullQuery = normalizeSearchText(query);
  const q = coreSearchQuery(query);
  const compactQuery = compact(q);
  if (!q) return { score: 0, match: "partial" };

  const symbol = normalizeSearchText(candidate.symbol);
  const compactSymbol = compact(candidate.symbol);
  const name = normalizeSearchText(candidate.name);
  const simpleName = candidate.kind === "company" ? plainCompanyName(candidate.name) : name;
  const shortName = normalizeSearchText(candidate.shortName ?? "");
  const aliases = (candidate.aliases ?? []).map(normalizeSearchText).filter(Boolean);
  const commonBoost = kindIntentBoost(candidate.kind, fullQuery) + prominence(candidate);

  if (compactSymbol === compactQuery || shortName === q) {
    return { score: 10_000 + commonBoost, match: "exact" };
  }
  if (name === q || simpleName === q) {
    return { score: 9_600 + commonBoost, match: "exact" };
  }
  if (aliases.some((alias) => alias === q || compact(alias) === compactQuery)) {
    return { score: 9_300 + commonBoost, match: "alias" };
  }
  if (compactSymbol.startsWith(compactQuery)) {
    return { score: 8_400 - compactSymbol.length + commonBoost, match: "prefix" };
  }
  if (name.startsWith(q) || simpleName.startsWith(q) || shortName.startsWith(q)) {
    return { score: 8_000 - name.length / 100 + commonBoost, match: "prefix" };
  }
  if (aliases.some((alias) => alias.startsWith(q))) {
    return { score: 7_700 + commonBoost, match: "prefix" };
  }

  const queryWords = q.split(" ");
  const searchableWords = [symbol, name, shortName, ...aliases]
    .join(" ")
    .split(" ")
    .filter(Boolean);
  if (queryWords.every((word) => searchableWords.some((candidateWord) => candidateWord.startsWith(word)))) {
    return { score: 6_900 + commonBoost, match: "partial" };
  }
  if ([symbol, name, shortName, ...aliases].some((value) => value.includes(q))) {
    return { score: 5_800 + commonBoost, match: "partial" };
  }

  const fuzzy = fuzzyScore(q, [candidate.symbol, candidate.name, candidate.shortName ?? "", ...(candidate.aliases ?? [])]);
  return fuzzy > 0
    ? { score: fuzzy + commonBoost, match: "fuzzy" }
    : { score: 0, match: "partial" };
}

export function rankGlobalSearch(
  query: string,
  candidates: SearchCandidate[],
  limit = 14,
): RankedSearchResult[] {
  const unique = new Map<string, RankedSearchResult>();
  for (const candidate of candidates) {
    const ranked = { ...candidate, ...scoreSearchCandidate(candidate, query) };
    if (ranked.score <= 0) continue;
    const previous = unique.get(candidate.id);
    if (!previous || ranked.score > previous.score) unique.set(candidate.id, ranked);
  }

  const ordered = [...unique.values()].sort(
    (left, right) =>
      right.score - left.score ||
      left.name.length - right.name.length ||
      left.symbol.localeCompare(right.symbol),
  );

  // Yahoo puede devolver la misma compañía en varias bolsas (Apple como AAPL,
  // APC.DE y APC.F). Conservamos la cotización mejor posicionada para que los
  // duplicados no desplacen resultados realmente distintos.
  const seenCompanies = new Set<string>();
  const deduplicated: RankedSearchResult[] = [];
  for (const result of ordered) {
    if (result.kind === "company") {
      const companyKey = plainCompanyName(result.name);
      if (seenCompanies.has(companyKey)) continue;
      seenCompanies.add(companyKey);
    }
    deduplicated.push(result);
    if (deduplicated.length === limit) break;
  }
  return deduplicated;
}
