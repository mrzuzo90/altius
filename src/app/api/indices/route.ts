import { NextResponse } from "next/server";
import { getAllIndicesSummary } from "@/lib/indices";

export const revalidate = 3600;

export async function GET() {
  try {
    const indices = await getAllIndicesSummary();
    return NextResponse.json({ indices });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ indices: [], error: message }, { status: 500 });
  }
}
