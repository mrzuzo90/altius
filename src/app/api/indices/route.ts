import { NextResponse } from "next/server";
import { getAllIndicesSummary } from "@/lib/indices";
import { upstreamError } from "@/lib/api/guard";

export const revalidate = 3600;

export async function GET() {
  try {
    const indices = await getAllIndicesSummary();
    return NextResponse.json({ indices });
  } catch (error) {
    return upstreamError("indices", error);
  }
}
