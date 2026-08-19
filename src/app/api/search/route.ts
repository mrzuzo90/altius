import { NextResponse } from "next/server";
import { searchTickers } from "@/lib/sec/tickers";

export const revalidate = 3600;

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  try {
    return NextResponse.json({ results: await searchTickers(q, 12) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ results: [], error: message }, { status: 502 });
  }
}
