import { NextResponse } from "next/server";
import { searchTickers } from "@/lib/sec/tickers";
import { getAllMarketIndices } from "@/lib/indices";
import { getAllCommodities } from "@/lib/commodities";

export const revalidate = 3600;

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const query = q.trim().toLowerCase();

  try {
    const tickersPromise = searchTickers(q, 10);
    const allIndices = getAllMarketIndices();
    const allCommodities = getAllCommodities();

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

    const results = await tickersPromise;
    return NextResponse.json({
      results,
      indices: matchingIndices,
      commodities: matchingCommodities,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { results: [], indices: [], commodities: [], error: message },
      { status: 502 },
    );
  }
}

