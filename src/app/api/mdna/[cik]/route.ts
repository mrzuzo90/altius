import { NextResponse } from "next/server";
import { findLatestFiling } from "@/lib/sec/submissions";
import { secFetchText } from "@/lib/sec/client";
import { extractMdna } from "@/lib/sec/mdna";
import { summarizeMdna } from "@/lib/ai/gemini";
import { TTL } from "@/lib/cache/store";

export const maxDuration = 120;

export async function GET(request: Request, { params }: { params: Promise<{ cik: string }> }) {
  const { cik } = await params;
  const nombre = new URL(request.url).searchParams.get("name") ?? "la empresa";
  try {
    const filing = await findLatestFiling(cik, ["10-K"]);
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
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
