import { NextResponse } from "next/server";
import { searchTickers } from "@/lib/sec/tickers";
import { getAllMarketIndices } from "@/lib/indices";
import { getAllCommodities } from "@/lib/commodities";
import { getAllCurrencyPairs } from "@/lib/currencies";

export const revalidate = 3600;

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const query = q.trim().toLowerCase();

  try {
    const tickersPromise = searchTickers(q, 10);
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

    const results = await tickersPromise;
    return NextResponse.json({
      results,
      indices: matchingIndices,
      commodities: matchingCommodities,
      currencies: matchingCurrencies,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { results: [], indices: [], commodities: [], currencies: [], error: message },
      { status: 502 },
    );
  }
}

