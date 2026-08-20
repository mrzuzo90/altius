import { NextResponse } from "next/server";
import { getPriceSeries } from "@/lib/prices";

export const revalidate = 21600;

export async function GET(_: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const r = await getPriceSeries(ticker);
  return NextResponse.json(r, { status: r.ok ? 200 : 404 });
}
