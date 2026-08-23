import { NextResponse } from "next/server";
import { searchTickers } from "@/lib/sec/tickers";
import { getAllMarketIndices } from "@/lib/indices";

export const revalidate = 3600;

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const query = q.trim().toLowerCase();

  try {
    const tickersPromise = searchTickers(q, 10);
    const allIndices = getAllMarketIndices();

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
            (query.includes("vix") && idx.symbol === "VIXCLS") ||
            (query.includes("indic") && true),
        )
      : [];

    const results = await tickersPromise;
    return NextResponse.json({ results, indices: matchingIndices });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ results: [], indices: [], error: message }, { status: 502 });
  }
}

