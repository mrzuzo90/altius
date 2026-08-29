import { NextResponse } from "next/server";
import { getPriceSeries } from "@/lib/prices";
import { invalidInput, rateLimit, upstreamError, validateTicker } from "@/lib/api/guard";

export const revalidate = 21600;

export async function GET(request: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const limited = rateLimit(request, "prices", 60, 60_000);
  if (limited) return limited;
  const validTicker = validateTicker(ticker);
  if (!validTicker) return invalidInput("Ticker no válido.");
  try {
    const result = await getPriceSeries(validTicker);
    return NextResponse.json(result, { status: result.ok ? 200 : 404 });
  } catch (error) {
    return upstreamError("prices", error);
  }
}
