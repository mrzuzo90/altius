import { NextResponse } from "next/server";
import { getCurrencyDetail, resolveCurrencySymbol } from "@/lib/currencies";
import { upstreamError } from "@/lib/api/guard";

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
    return upstreamError("currency-detail", error);
  }
}
