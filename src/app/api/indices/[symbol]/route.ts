import { NextResponse } from "next/server";
import { getIndexDetail, resolveIndexSymbol } from "@/lib/indices";
import { upstreamError } from "@/lib/api/guard";

export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params;
  const meta = resolveIndexSymbol(rawSymbol);

  if (!meta) {
    return NextResponse.json({ error: `Índice no encontrado: ${rawSymbol}` }, { status: 404 });
  }

  try {
    const detail = await getIndexDetail(meta.symbol);
    return NextResponse.json(detail);
  } catch (error) {
    return upstreamError("index-detail", error);
  }
}
