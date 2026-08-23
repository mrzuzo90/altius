import { NextResponse } from "next/server";
import { getIndexDetail, resolveIndexSymbol } from "@/lib/indices";

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
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
