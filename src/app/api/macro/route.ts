import { NextResponse } from "next/server";
import { FRED_SERIES, getFredSeries, type FredSeriesId } from "@/lib/fred/client";

export const revalidate = 86400;

export async function GET() {
  const ids = Object.keys(FRED_SERIES) as FredSeriesId[];
  const series = await Promise.all(
    ids.map(async (id) => {
      try {
        return { id, ...FRED_SERIES[id], observations: await getFredSeries(id), error: null };
      } catch (error) {
        return {
          id,
          ...FRED_SERIES[id],
          observations: [],
          error: error instanceof Error ? error.message : "Error desconocido",
        };
      }
    }),
  );
  return NextResponse.json({ series });
}
