import { NextResponse } from "next/server";
import { getCompanyNews } from "@/lib/news";
import { resolveTicker } from "@/lib/sec/tickers";
import { resolveIndexSymbol } from "@/lib/indices";
import { boundedText, invalidInput, rateLimit, upstreamError, validateCik, validateTicker } from "@/lib/api/guard";

export const revalidate = 1800; // 30 minutos

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker: rawTicker } = await params;
  const limited = rateLimit(request, "news", 30, 60_000);
  if (limited) return limited;
  const ticker = validateTicker(rawTicker);
  if (!ticker) return invalidInput("Ticker no válido.");

  try {
    const url = new URL(request.url);
    const rawCik = url.searchParams.get("cik");
    let cik = rawCik ? validateCik(rawCik) ?? undefined : undefined;
    let name = boundedText(url.searchParams.get("name"), 120) ?? undefined;

    if (!name || !cik) {
      const hit = await resolveTicker(ticker);
      if (hit) {
        cik = hit.cik;
        name = hit.name;
      } else {
        const indexMeta = resolveIndexSymbol(ticker);
        if (indexMeta) {
          name = indexMeta.name;
        } else {
          name = ticker;
        }
      }
    }

    const newsResult = await getCompanyNews(ticker, name, cik);
    return NextResponse.json(newsResult);
  } catch (error) {
    return upstreamError("news", error);
  }
}
