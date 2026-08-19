import { NextResponse } from "next/server";
import { buildStatements } from "@/lib/sec/statements";
import type { Frequency } from "@/lib/sec/normalize";

export const revalidate = 21600;

export async function GET(request: Request, { params }: { params: Promise<{ cik: string }> }) {
  const { cik } = await params;
  const freq = new URL(request.url).searchParams.get("freq");
  const frequency: Frequency = freq === "quarterly" ? "quarterly" : "annual";
  try {
    return NextResponse.json(await buildStatements(cik, frequency));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
