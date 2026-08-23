import { NextResponse } from "next/server";
import { getCurrencyDetail, resolveCurrencySymbol } from "@/lib/currencies";

export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pair: string }> },
) {
  const { pair } = await params;
  const meta = resolveCurrencySymbol(pair);

  if (!meta) {
    return NextResponse.json(
      { error: `Par de divisas no encontrado: ${pair}` },
      { status: 404 },
    );
  }

  try {
    const detail = await getCurrencyDetail(meta.symbol);
    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
