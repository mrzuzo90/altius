import { getQualityScreenerBatch } from "@/lib/quality-screener";
import { invalidInput, rateLimit, upstreamError } from "@/lib/api/guard";

export const dynamic = "force-dynamic";

function integerParam(value: string | null, fallback: number): number | null {
  if (value === null) return fallback;
  return /^\d+$/.test(value) ? Number.parseInt(value, 10) : null;
}

export async function GET(request: Request) {
  const limited = rateLimit(request, "quality-screener", 30, 60_000);
  if (limited) return limited;
  const url = new URL(request.url);
  const offset = integerParam(url.searchParams.get("offset"), 0);
  const limit = integerParam(url.searchParams.get("limit"), 10);
  if (offset === null || limit === null || offset < 0 || offset > 100 || limit < 1 || limit > 10) {
    return invalidInput("El lote solicitado no es válido.");
  }

  try {
    return Response.json(await getQualityScreenerBatch(offset, limit), {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (error) {
    return upstreamError("companies/quality", error);
  }
}
