import { NextResponse } from "next/server";
import { getDailyPrices } from "@/lib/prices";

export const revalidate = 21600;

export async function GET(_: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const r = await getDailyPrices(ticker);
  return NextResponse.json(r, { status: r.ok ? 200 : 404 });
}
