import { NextResponse } from "next/server";
import { getAllCurrenciesSummary } from "@/lib/currencies";

export const revalidate = 3600;

export async function GET() {
  try {
    const currencies = await getAllCurrenciesSummary();
    return NextResponse.json({ currencies });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ currencies: [], error: message }, { status: 500 });
  }
}
