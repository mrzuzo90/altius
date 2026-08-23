import { NextResponse } from "next/server";
import { getCompanyNews } from "@/lib/news";
import { resolveTicker } from "@/lib/sec/tickers";
import { resolveIndexSymbol } from "@/lib/indices";

export const revalidate = 1800; // 30 minutos

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker: rawTicker } = await params;
  const ticker = rawTicker.toUpperCase();

  try {
    const url = new URL(request.url);
    let cik = url.searchParams.get("cik") ?? undefined;
    let name = url.searchParams.get("name") ?? undefined;

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
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message, news: [] }, { status: 500 });
  }
}
