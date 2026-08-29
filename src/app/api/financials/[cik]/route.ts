import { NextResponse } from "next/server";
import { buildStatements } from "@/lib/sec/statements";
import type { Frequency } from "@/lib/sec/normalize";
import { invalidInput, rateLimit, upstreamError, validateCik } from "@/lib/api/guard";

export const revalidate = 21600;

export async function GET(request: Request, { params }: { params: Promise<{ cik: string }> }) {
  const { cik } = await params;
  const limited = rateLimit(request, "financials", 30, 60_000);
  if (limited) return limited;
  const validCik = validateCik(cik);
  if (!validCik) return invalidInput("El CIK debe contener entre 1 y 10 dígitos.");
  const freq = new URL(request.url).searchParams.get("freq");
  const frequency: Frequency = freq === "quarterly" ? "quarterly" : "annual";
  try {
    return NextResponse.json(await buildStatements(validCik, frequency));
  } catch (error) {
    return upstreamError("financials", error);
  }
}
