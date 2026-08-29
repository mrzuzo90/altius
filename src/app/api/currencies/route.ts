import { NextResponse } from "next/server";
import { getAllCurrenciesSummary } from "@/lib/currencies";
import { upstreamError } from "@/lib/api/guard";

export const revalidate = 3600;

export async function GET() {
  try {
    const currencies = await getAllCurrenciesSummary();
    return NextResponse.json({ currencies });
  } catch (error) {
    return upstreamError("currencies", error);
  }
}
