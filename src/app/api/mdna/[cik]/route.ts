import { NextResponse } from "next/server";
import { findLatestFiling } from "@/lib/sec/submissions";
import { secFetchText } from "@/lib/sec/client";
import { extractMdna } from "@/lib/sec/mdna";
import { summarizeMdna } from "@/lib/ai/gemini";
import { TTL } from "@/lib/cache/store";
import { boundedText, invalidInput, rateLimit, upstreamError, validateCik } from "@/lib/api/guard";

export const maxDuration = 120;

export async function GET(request: Request, { params }: { params: Promise<{ cik: string }> }) {
  const { cik } = await params;
  const limited = rateLimit(request, "mdna", 5, 60 * 60_000);
  if (limited) return limited;
  const validCik = validateCik(cik);
  if (!validCik) return invalidInput("El CIK debe contener entre 1 y 10 dígitos.");
  const nombre = boundedText(new URL(request.url).searchParams.get("name"), 120) ?? "la empresa";
  try {
    const filing = await findLatestFiling(validCik, ["10-K"]);
    if (!filing) {
      return NextResponse.json({ error: "Sin 10-K reciente en EDGAR." }, { status: 404 });
    }
    const html = await secFetchText(filing.documentUrl, TTL.filingDocument);
    const seccion = extractMdna(html, "10-K");
    if (!seccion) {
      return NextResponse.json(
        { error: "No se ha localizado el apartado Item 7 en el documento." },
        { status: 422 },
      );
    }
    const body = await summarizeMdna(seccion.text, nombre, filing.reportDate);
    return NextResponse.json({ filing, chars: seccion.chars, ...body });
  } catch (error) {
    return upstreamError("mdna", error);
  }
}
