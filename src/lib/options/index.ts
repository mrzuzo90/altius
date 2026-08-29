import "server-only";

import { getCacheStore, TTL } from "@/lib/cache/store";
import { fetchWithTimeout } from "@/lib/http";
import { analyzeOptionExpiration } from "./analysis";
import type { OptionContractQuote, OptionsMarketAnalysis, OptionsAnalysisReady } from "./types";

export type {
  OptionContractQuote,
  OptionExpirationAnalysis,
  OptionStrikeSnapshot,
  OptionsMarketAnalysis,
} from "./types";
export { analyzeOptionExpiration } from "./analysis";

const TARGET_DTE = [45, 120] as const;
const MARKETDATA_STRIKE_LIMIT = 14;

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function nonNegativeInteger(value: unknown): number {
  const parsed = numberOrNull(value);
  return parsed === null ? 0 : Math.max(0, Math.round(parsed));
}

function isoDate(value: unknown): string | null {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const numeric = numberOrNull(value);
  if (numeric === null) return null;
  const millis = numeric < 10_000_000_000 ? numeric * 1000 : numeric;
  const date = new Date(millis);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function isoTimestamp(value: unknown): string | null {
  if (typeof value === "string") {
    const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const numeric = numberOrNull(value);
  if (numeric === null) return null;
  const millis = numeric < 10_000_000_000 ? numeric * 1000 : numeric;
  const date = new Date(millis);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function valueAt(payload: UnknownRecord, key: string, index: number): unknown {
  const value = payload[key];
  return Array.isArray(value) ? value[index] : value;
}

function normalizeSide(value: unknown): "call" | "put" | null {
  const side = String(value ?? "").toLowerCase();
  if (side === "call" || side === "c") return "call";
  if (side === "put" || side === "p") return "put";
  return null;
}

function normalizeTradierSymbol(ticker: string): string {
  return ticker.replace(/^(BRK|BF)\.(A|B)$/i, "$1/$2");
}

function groupAndAnalyze(
  contracts: OptionContractQuote[],
  fallbackPrice: number | null,
): { underlyingPrice: number; expirations: NonNullable<ReturnType<typeof analyzeOptionExpiration>>[] } | null {
  const underlyingPrice = contracts
    .map((contract) => contract.underlyingPrice)
    .find((price): price is number => price !== null && price > 0) ?? fallbackPrice;
  if (underlyingPrice === null || underlyingPrice <= 0) return null;

  const groups = new Map<string, OptionContractQuote[]>();
  for (const contract of contracts) {
    const group = groups.get(contract.expiration) ?? [];
    group.push(contract);
    groups.set(contract.expiration, group);
  }
  const expirations = [...groups.values()]
    .map((group) => analyzeOptionExpiration(group, underlyingPrice))
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.expiration.localeCompare(b.expiration));
  return expirations.length > 0 ? { underlyingPrice, expirations } : null;
}

function latestTimestamp(contracts: OptionContractQuote[]): string | null {
  return contracts
    .map((contract) => contract.updatedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;
}

async function fetchTradierJson(path: string, token: string, sandbox: boolean): Promise<Response> {
  const base = sandbox ? "https://sandbox.tradier.com/v1" : "https://api.tradier.com/v1";
  return fetchWithTimeout(`${base}${path}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  }, 20_000);
}

function pickExpirations(dates: string[], now = new Date()): string[] {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const future = [...new Set(dates)]
    .map((date) => ({ date, dte: Math.ceil((Date.parse(`${date}T20:00:00Z`) - today) / 86_400_000) }))
    .filter((item) => Number.isFinite(item.dte) && item.dte >= 7)
    .sort((a, b) => a.dte - b.dte);
  const selected = TARGET_DTE.map((target) =>
    future.reduce<typeof future[number] | null>(
      (best, item) => !best || Math.abs(item.dte - target) < Math.abs(best.dte - target) ? item : best,
      null,
    ),
  ).filter((item): item is NonNullable<typeof item> => item !== null);
  return [...new Set(selected.map((item) => item.date))];
}

function parseTradierContracts(payload: unknown, fallbackExpiration: string): OptionContractQuote[] {
  const root = record(payload);
  const options = record(root?.options);
  const rawQuotes = options?.option;
  const quotes = Array.isArray(rawQuotes) ? rawQuotes : rawQuotes ? [rawQuotes] : [];
  return quotes.flatMap((raw): OptionContractQuote[] => {
    const quote = record(raw);
    if (!quote) return [];
    const side = normalizeSide(quote.option_type);
    const strike = numberOrNull(quote.strike);
    const expiration = isoDate(quote.expiration_date) ?? fallbackExpiration;
    if (!side || strike === null || !expiration) return [];
    const greeks = record(quote.greeks);
    return [{
      symbol: String(quote.symbol ?? ""),
      side,
      expiration,
      strike,
      bid: numberOrNull(quote.bid),
      ask: numberOrNull(quote.ask),
      bidSize: numberOrNull(quote.bidsize),
      askSize: numberOrNull(quote.asksize),
      last: numberOrNull(quote.last),
      volume: nonNegativeInteger(quote.volume),
      openInterest: nonNegativeInteger(quote.open_interest),
      impliedVolatility: numberOrNull(greeks?.mid_iv ?? greeks?.smv_vol),
      delta: numberOrNull(greeks?.delta),
      gamma: numberOrNull(greeks?.gamma),
      theta: numberOrNull(greeks?.theta),
      vega: numberOrNull(greeks?.vega),
      underlyingPrice: null,
      updatedAt: isoTimestamp(greeks?.updated_at ?? quote.ask_date ?? quote.trade_date),
    }];
  });
}

async function getTradierAnalysis(ticker: string, token: string): Promise<OptionsMarketAnalysis> {
  const sandbox = process.env.TRADIER_ENV?.trim().toLowerCase() === "sandbox";
  const symbol = normalizeTradierSymbol(ticker);
  try {
    const [expirationResponse, quoteResponse] = await Promise.all([
      fetchTradierJson(`/markets/options/expirations?symbol=${encodeURIComponent(symbol)}&includeAllRoots=true`, token, sandbox),
      fetchTradierJson(`/markets/quotes?symbols=${encodeURIComponent(symbol)}&greeks=false`, token, sandbox),
    ]);
    if (expirationResponse.status === 429 || quoteResponse.status === 429) {
      return { status: "unavailable", ticker, reason: "rate-limited", message: "Tradier ha agotado temporalmente la cuota de consultas." };
    }
    if (!expirationResponse.ok || !quoteResponse.ok) {
      return { status: "unavailable", ticker, reason: "provider-error", message: "Tradier no ha podido devolver la cadena de opciones en este momento." };
    }
    const expirationPayload = record(await expirationResponse.json());
    const expirationRoot = record(expirationPayload?.expirations);
    const rawDates = expirationRoot?.date;
    const dates = (Array.isArray(rawDates) ? rawDates : rawDates ? [rawDates] : [])
      .map(isoDate)
      .filter((date): date is string => Boolean(date));
    const selected = pickExpirations(dates);
    if (selected.length === 0) {
      return { status: "unavailable", ticker, reason: "not-found", message: "No hay vencimientos de opciones listados para este valor." };
    }
    const quotePayload = record(await quoteResponse.json());
    const quoteRoot = record(quotePayload?.quotes);
    const rawUnderlying = quoteRoot?.quote;
    const underlyingQuote = record(Array.isArray(rawUnderlying) ? rawUnderlying[0] : rawUnderlying);
    const fallbackPrice = numberOrNull(underlyingQuote?.last ?? underlyingQuote?.ask ?? underlyingQuote?.bid);

    const chainResponses = await Promise.all(selected.map((expiration) =>
      fetchTradierJson(
        `/markets/options/chains?symbol=${encodeURIComponent(symbol)}&expiration=${expiration}&greeks=true`,
        token,
        sandbox,
      ).then(async (response) => ({ expiration, response, payload: response.ok ? await response.json() : null })),
    ));
    if (chainResponses.some(({ response }) => response.status === 429)) {
      return { status: "unavailable", ticker, reason: "rate-limited", message: "Tradier ha agotado temporalmente la cuota de consultas." };
    }
    const contracts = chainResponses.flatMap(({ expiration, payload }) => parseTradierContracts(payload, expiration));
    const analyzed = groupAndAnalyze(contracts, fallbackPrice);
    if (!analyzed) {
      return { status: "unavailable", ticker, reason: "not-found", message: "Tradier no ha encontrado una cadena de opciones utilizable para este valor." };
    }
    return {
      status: "ready",
      ticker,
      provider: sandbox ? "Tradier Sandbox" : "Tradier",
      providerHref: "https://docs.tradier.com/docs/market-data",
      freshness: sandbox ? "15 minutos de retraso" : "Tiempo real (Greeks horarios)",
      coverage: "Cadena completa en dos vencimientos representativos",
      asOf: latestTimestamp(contracts),
      underlyingPrice: analyzed.underlyingPrice,
      expirations: analyzed.expirations,
    };
  } catch {
    return { status: "unavailable", ticker, reason: "provider-error", message: "No se ha podido conectar con Tradier. El análisis de precio sigue disponible." };
  }
}

function parseMarketDataContracts(payload: unknown): OptionContractQuote[] {
  const root = record(payload);
  if (!root || root.s !== "ok") return [];
  const optionSymbols = root.optionSymbol;
  const count = Array.isArray(optionSymbols) ? optionSymbols.length : optionSymbols ? 1 : 0;
  const contracts: OptionContractQuote[] = [];
  for (let index = 0; index < count; index++) {
    const side = normalizeSide(valueAt(root, "side", index));
    const strike = numberOrNull(valueAt(root, "strike", index));
    const expiration = isoDate(valueAt(root, "expiration", index));
    if (!side || strike === null || !expiration) continue;
    contracts.push({
      symbol: String(valueAt(root, "optionSymbol", index) ?? ""),
      side,
      expiration,
      strike,
      bid: numberOrNull(valueAt(root, "bid", index)),
      ask: numberOrNull(valueAt(root, "ask", index)),
      bidSize: numberOrNull(valueAt(root, "bidSize", index)),
      askSize: numberOrNull(valueAt(root, "askSize", index)),
      last: numberOrNull(valueAt(root, "last", index)),
      volume: nonNegativeInteger(valueAt(root, "volume", index)),
      openInterest: nonNegativeInteger(valueAt(root, "openInterest", index)),
      impliedVolatility: numberOrNull(valueAt(root, "iv", index)),
      delta: numberOrNull(valueAt(root, "delta", index)),
      gamma: numberOrNull(valueAt(root, "gamma", index)),
      theta: numberOrNull(valueAt(root, "theta", index)),
      vega: numberOrNull(valueAt(root, "vega", index)),
      underlyingPrice: numberOrNull(valueAt(root, "underlyingPrice", index)),
      updatedAt: isoTimestamp(valueAt(root, "updated", index)),
    });
  }
  return contracts;
}

async function getMarketDataAnalysis(ticker: string, token: string | null): Promise<OptionsMarketAnalysis> {
  try {
    const headers: HeadersInit = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const responses = await Promise.all(TARGET_DTE.map(async (dte) => {
      const params = new URLSearchParams({
        dte: String(dte),
        strikeLimit: String(MARKETDATA_STRIKE_LIMIT),
        nonstandard: "false",
      });
      const response = await fetchWithTimeout(
        `https://api.marketdata.app/v1/options/chain/${encodeURIComponent(ticker)}/?${params}`,
        { cache: "no-store", headers },
        25_000,
      );
      return { response, payload: response.ok ? await response.json() : null };
    }));
    if (responses.some(({ response }) => response.status === 429)) {
      return { status: "unavailable", ticker, reason: "rate-limited", message: "La capa gratuita de Market Data ha consumido sus créditos diarios. Los datos volverán a estar disponibles en la próxima ventana." };
    }
    if (responses.every(({ response }) => response.status === 401 || response.status === 403)) {
      return { status: "unavailable", ticker, reason: "not-configured", message: "La API de opciones necesita un token válido de Market Data." };
    }
    const contracts = responses.flatMap(({ payload }) => parseMarketDataContracts(payload));
    const deduplicated = [...new Map(contracts.map((contract) => [contract.symbol, contract])).values()];
    const analyzed = groupAndAnalyze(deduplicated, null);
    if (!analyzed) {
      return { status: "unavailable", ticker, reason: "not-found", message: "No hay una cadena de opciones estadounidense disponible para este valor." };
    }
    const demo = !token;
    return {
      status: "ready",
      ticker,
      provider: demo ? "Market Data · demo AAPL" : "Market Data",
      providerHref: "https://www.marketdata.app/docs/api/options/chain/",
      freshness: demo ? "24 horas de retraso" : "Según el plan contratado; consulta la hora exacta mostrada",
      coverage: `${MARKETDATA_STRIKE_LIMIT} strikes más próximos al dinero en dos vencimientos`,
      asOf: latestTimestamp(deduplicated),
      underlyingPrice: analyzed.underlyingPrice,
      expirations: analyzed.expirations,
    };
  } catch {
    return { status: "unavailable", ticker, reason: "provider-error", message: "No se ha podido conectar con Market Data. El análisis de precio sigue disponible." };
  }
}

export async function getOptionsMarketAnalysis(tickerInput: string): Promise<OptionsMarketAnalysis> {
  const ticker = tickerInput.trim().toUpperCase();
  const tradierToken = process.env.TRADIER_API_TOKEN?.trim() || null;
  const marketDataToken = process.env.MARKETDATA_API_TOKEN?.trim() || null;
  const provider = tradierToken ? "tradier" : marketDataToken ? "marketdata" : ticker === "AAPL" ? "marketdata-demo" : null;
  if (!provider) {
    return {
      status: "unavailable",
      ticker,
      reason: "not-configured",
      message: "Activa TRADIER_API_TOKEN o MARKETDATA_API_TOKEN para consultar volumen, interés abierto y precios bid/ask. AAPL funciona como demostración sin clave.",
    };
  }

  const cache = getCacheStore();
  const cacheKey = `options:pressure:v1:${provider}:${ticker}`;
  const cached = await cache.get<OptionsAnalysisReady>(cacheKey);
  if (cached?.status === "ready") return cached;

  const result = tradierToken
    ? await getTradierAnalysis(ticker, tradierToken)
    : await getMarketDataAnalysis(ticker, marketDataToken);
  if (result.status === "ready") {
    await cache.set(
      cacheKey,
      result,
      provider === "tradier" && process.env.TRADIER_ENV?.trim().toLowerCase() !== "sandbox"
        ? TTL.optionsRealtime
        : TTL.optionsDelayed,
    );
  }
  return result;
}
