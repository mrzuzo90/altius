import { NextResponse } from "next/server";
import { getAllCommoditiesSummary, type CommodityCategory } from "@/lib/commodities";

export const revalidate = 3600;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const cat = url.searchParams.get("category") as CommodityCategory | null;
    const commodities = await getAllCommoditiesSummary(cat ?? undefined);
    return NextResponse.json({ commodities });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ commodities: [], error: message }, { status: 500 });
  }
}
