import { NextResponse } from "next/server";
import { rateLimit, validateTicker } from "@/lib/api/guard";
import { getLiveQuote } from "@/lib/quotes/client";

export const revalidate = 0;

export async function GET(request: Request) {
  const limited = rateLimit(request, "watchlist-quotes", 30, 60_000);
  if (limited) return limited;
  const raw = new URL(request.url).searchParams.get("tickers") ?? "";
  const requested = [...new Set(raw.split(",").map((ticker) => validateTicker(ticker)).filter((ticker): ticker is string => Boolean(ticker)))];
  if (requested.length === 0) {
    return NextResponse.json({ quotes: [], asOf: new Date().toISOString() });
  }
  if (requested.length > 25) {
    return NextResponse.json({ error: "Se permiten como máximo 25 cotizaciones por consulta." }, { status: 400 });
  }

  const quotes = (await Promise.all(
    requested.map((ticker) => getLiveQuote(ticker, { freshness: "alert" })),
  )).filter((quote): quote is NonNullable<typeof quote> => quote !== null);

  return NextResponse.json(
    { quotes, asOf: new Date().toISOString() },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
