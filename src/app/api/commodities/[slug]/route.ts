import { NextResponse } from "next/server";
import { getCommodityDetail, resolveCommoditySymbol } from "@/lib/commodities";
import { upstreamError } from "@/lib/api/guard";

export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const meta = resolveCommoditySymbol(slug);

  if (!meta) {
    return NextResponse.json(
      { error: `Materia prima no encontrada: ${slug}` },
      { status: 404 },
    );
  }

  try {
    const detail = await getCommodityDetail(meta.symbol);
    return NextResponse.json(detail);
  } catch (error) {
    return upstreamError("commodity-detail", error);
  }
}
