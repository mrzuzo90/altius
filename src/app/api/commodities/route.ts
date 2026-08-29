import { NextResponse } from "next/server";
import { getAllCommoditiesSummary, type CommodityCategory } from "@/lib/commodities";
import { invalidInput, upstreamError } from "@/lib/api/guard";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawCategory = url.searchParams.get("category");
    const allowed = new Set<CommodityCategory>(["energy", "precious_metals", "industrial_metals", "agriculture"]);
    if (rawCategory && !allowed.has(rawCategory as CommodityCategory)) {
      return invalidInput("Categoría de materia prima no válida.");
    }
    const cat = rawCategory as CommodityCategory | null;
    const commodities = await getAllCommoditiesSummary(cat ?? undefined);
    return NextResponse.json({ commodities });
  } catch (error) {
    return upstreamError("commodities", error);
  }
}
