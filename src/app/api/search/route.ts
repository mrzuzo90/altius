import { NextResponse } from "next/server";
import { searchTickers } from "@/lib/sec/tickers";
import { getAllMarketIndices } from "@/lib/indices";
import { getAllCommodities } from "@/lib/commodities";
import { getAllCurrencyPairs } from "@/lib/currencies";
import { boundedText, invalidInput, rateLimit, upstreamError } from "@/lib/api/guard";
import { searchEsefCompanies } from "@/lib/esef/resolve";
import { coreSearchQuery, rankGlobalSearch, type SearchCandidate } from "@/lib/search/ranking";

export const revalidate = 3600;

const INDEX_ALIASES: Record<string, string[]> = {
  SP500: ["S&P 500", "SP 500", "SP500"],
  NASDAQCOM: ["NASDAQ", "NASDAQ COMPOSITE"],
  DJIA: ["DOW", "DOW JONES", "WALL STREET 30"],
  DAX: ["DAX", "DAX 40"],
  IBEX35: ["IBEX", "IBEX 35"],
  STOXX50E: ["STOXX", "EURO STOXX 50"],
  FTSE100: ["FTSE", "FTSE 100"],
  CAC40: ["CAC", "CAC 40"],
  VIXCLS: ["VIX", "INDICE DEL MIEDO"],
};

const COMMODITY_ALIASES: Record<string, string[]> = {
  GOLD: ["ORO", "GOLD"],
  SILVER: ["PLATA", "SILVER"],
  BRENT: ["PETROLEO", "PETROLEO BRENT", "CRUDO", "OIL"],
  WTI: ["PETROLEO", "PETROLEO WTI", "CRUDO", "OIL"],
  NATGAS: ["GAS", "GAS NATURAL"],
  COPPER: ["COBRE", "COPPER"],
  WHEAT: ["TRIGO", "WHEAT"],
  CORN: ["MAIZ", "CORN"],
};

const CURRENCY_ALIASES: Record<string, string[]> = {
  EURUSD: ["EUR/USD", "EURO", "EURO DOLAR"],
  GBPUSD: ["GBP/USD", "LIBRA", "LIBRA DOLAR"],
  USDJPY: ["USD/JPY", "YEN", "DOLAR YEN"],
  USDCHF: ["USD/CHF", "FRANCO", "FRANCO SUIZO"],
  USDCAD: ["USD/CAD", "DOLAR CANADIENSE"],
  AUDUSD: ["AUD/USD", "DOLAR AUSTRALIANO"],
  USDCNY: ["USD/CNY", "YUAN", "RENMINBI"],
  USDMXN: ["USD/MXN", "PESO", "PESO MEXICANO"],
  DXY: ["DXY", "INDICE DOLAR", "DOLAR"],
};

export async function GET(request: Request) {
  const limited = rateLimit(request, "search", 60, 60_000);
  if (limited) return limited;
  const rawQuery = new URL(request.url).searchParams.get("q");
  if (rawQuery && rawQuery.length > 80) return invalidInput("La búsqueda es demasiado larga.");
  const q = boundedText(rawQuery, 80) ?? "";
  const query = q.trim().toLowerCase();
  const sourceQuery = coreSearchQuery(q);

  try {
    const tickersPromise = searchTickers(sourceQuery, 10).catch(() => []);
    const europeanPromise = searchEsefCompanies(sourceQuery, 8);
    const allIndices = getAllMarketIndices();
    const allCommodities = getAllCommodities();
    const allCurrencies = getAllCurrencyPairs();

    const matchingIndices = query
      ? allIndices.filter(
          (idx) =>
            idx.symbol.toLowerCase().includes(query) ||
            idx.name.toLowerCase().includes(query) ||
            idx.shortName.toLowerCase().includes(query) ||
            idx.slug.toLowerCase().includes(query) ||
            (query.includes("sp500") && idx.symbol === "SP500") ||
            (query.includes("s&p") && idx.symbol === "SP500") ||
            (query.includes("nasda") && idx.symbol === "NASDAQCOM") ||
            (query.includes("dow") && idx.symbol === "DJIA") ||
            (query.includes("dax") && idx.symbol === "DAX") ||
            (query.includes("ibex") && idx.symbol === "IBEX35") ||
            (query.includes("stoxx") && idx.symbol === "STOXX50E") ||
            (query.includes("ftse") && idx.symbol === "FTSE100") ||
            (query.includes("cac") && idx.symbol === "CAC40") ||
            (query.includes("vix") && idx.symbol === "VIXCLS") ||
            (query.includes("indic") && true),
        )
      : [];

    const matchingCommodities = query
      ? allCommodities.filter(
          (com) =>
            com.symbol.toLowerCase().includes(query) ||
            com.name.toLowerCase().includes(query) ||
            com.shortName.toLowerCase().includes(query) ||
            com.slug.toLowerCase().includes(query) ||
            (query.includes("oro") && com.symbol === "GOLD") ||
            (query.includes("gold") && com.symbol === "GOLD") ||
            (query.includes("plata") && com.symbol === "SILVER") ||
            (query.includes("silver") && com.symbol === "SILVER") ||
            (query.includes("petrol") && (com.symbol === "BRENT" || com.symbol === "WTI")) ||
            (query.includes("crudo") && (com.symbol === "BRENT" || com.symbol === "WTI")) ||
            (query.includes("oil") && (com.symbol === "BRENT" || com.symbol === "WTI")) ||
            (query.includes("brent") && com.symbol === "BRENT") ||
            (query.includes("wti") && com.symbol === "WTI") ||
            (query.includes("gas") && com.symbol === "NATGAS") ||
            (query.includes("cobre") && com.symbol === "COPPER") ||
            (query.includes("copper") && com.symbol === "COPPER") ||
            (query.includes("trigo") && com.symbol === "WHEAT") ||
            (query.includes("maiz") && com.symbol === "CORN") ||
            (query.includes("materia") && true),
        )
      : [];

    const matchingCurrencies = query
      ? allCurrencies.filter(
          (cur) =>
            cur.symbol.toLowerCase().includes(query) ||
            cur.name.toLowerCase().includes(query) ||
            cur.shortName.toLowerCase().includes(query) ||
            cur.slug.toLowerCase().includes(query) ||
            (query.includes("eur") && cur.symbol === "EURUSD") ||
            (query.includes("euro") && cur.symbol === "EURUSD") ||
            (query.includes("gbp") && cur.symbol === "GBPUSD") ||
            (query.includes("libra") && cur.symbol === "GBPUSD") ||
            (query.includes("jpy") && cur.symbol === "USDJPY") ||
            (query.includes("yen") && cur.symbol === "USDJPY") ||
            (query.includes("chf") && cur.symbol === "USDCHF") ||
            (query.includes("franco") && cur.symbol === "USDCHF") ||
            (query.includes("cad") && cur.symbol === "USDCAD") ||
            (query.includes("cny") && cur.symbol === "USDCNY") ||
            (query.includes("yuan") && cur.symbol === "USDCNY") ||
            (query.includes("mxn") && cur.symbol === "USDMXN") ||
            (query.includes("peso") && cur.symbol === "USDMXN") ||
            (query.includes("dxy") && cur.symbol === "DXY") ||
            (query.includes("dolar") && (cur.symbol === "DXY" || cur.symbol === "EURUSD")) ||
            (query.includes("forex") && true) ||
            (query.includes("divis") && true),
        )
      : [];

    const [results, european] = await Promise.all([tickersPromise, europeanPromise]);
    const candidates: SearchCandidate[] = [
      ...european.map((company) => ({
        id: `company:europe:${company.ticker}`,
        kind: "company" as const,
        symbol: company.ticker,
        name: company.name,
        aliases: company.aliases,
        href: `/ticker/${company.ticker.toUpperCase()}`,
        meta: `${company.exchange} · ${company.country}`,
      })),
      ...results.map((company) => ({
        id: `company:sec:${company.cik}:${company.ticker}`,
        kind: "company" as const,
        symbol: company.ticker,
        name: company.name,
        aliases: company.matchedAlias ? [company.matchedAlias] : undefined,
        href: `/ticker/${company.ticker.toUpperCase()}`,
        meta: "Empresa cotizada · SEC",
      })),
      ...allIndices.map((index) => ({
        id: `index:${index.symbol}`,
        kind: "index" as const,
        symbol: index.symbol,
        shortName: index.shortName,
        name: index.name,
        aliases: ["ÍNDICE", "ÍNDICES", ...(INDEX_ALIASES[index.symbol] ?? [])],
        href: `/indices/${index.slug}`,
        meta: "Índice bursátil",
      })),
      ...allCommodities.map((commodity) => ({
        id: `commodity:${commodity.symbol}`,
        kind: "commodity" as const,
        symbol: commodity.symbol,
        shortName: commodity.shortName,
        name: commodity.name,
        aliases: [
          "MATERIA PRIMA",
          "MATERIAS PRIMAS",
          "COMMODITY",
          ...(COMMODITY_ALIASES[commodity.symbol] ?? []),
        ],
        href: `/commodities/${commodity.slug}`,
        meta: `Materia prima · ${commodity.unit}`,
      })),
      ...allCurrencies.map((currency) => ({
        id: `currency:${currency.symbol}`,
        kind: "currency" as const,
        symbol: currency.symbol,
        shortName: currency.shortName,
        name: currency.name,
        aliases: [
          "DIVISA",
          "DIVISAS",
          "FOREX",
          "TIPO DE CAMBIO",
          ...(CURRENCY_ALIASES[currency.symbol] ?? []),
        ],
        href: `/divisas/${currency.slug}`,
        meta: "Divisa · Forex",
      })),
    ];
    const ranked = rankGlobalSearch(q, candidates);

    return NextResponse.json({
      ranked,
      results,
      european,
      indices: matchingIndices,
      commodities: matchingCommodities,
      currencies: matchingCurrencies,
    });
  } catch (error) {
    return upstreamError("search", error);
  }
}
