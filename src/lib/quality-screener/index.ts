import { getCacheStore, TTL } from "@/lib/cache/store";
import { getCompactPriceSeries } from "@/lib/prices";
import { evaluateQualityScorecard, type QualityItemStatus } from "@/lib/sec/quality";
import { buildStatements, hasUsableData } from "@/lib/sec/statements";
import { resolveTicker } from "@/lib/sec/tickers";
import { buildHistoricalPeSeries } from "@/lib/valuation/historical-pe";
import {
  QUALITY_SCREENER_UNIVERSE,
  type ScreenerRegion,
  type ScreenerUniverseCompany,
} from "./universe";

export type QualityScreenerKey = {
  id: string;
  name: string;
  status: QualityItemStatus;
  value: string;
};

export type QualityScreenerCompany = {
  ticker: string;
  name: string;
  sector: string;
  region: ScreenerRegion;
  country: string;
  score: number | null;
  coverage: number;
  keys: QualityScreenerKey[];
  latestPeriodEnd: string | null;
  source: string | null;
  analysisStatus: "available" | "unavailable";
};

export type QualityScreenerBatch = {
  items: QualityScreenerCompany[];
  offset: number;
  nextOffset: number | null;
  total: number;
};

function unavailable(meta: ScreenerUniverseCompany, name = meta.ticker): QualityScreenerCompany {
  return {
    ticker: meta.ticker,
    name,
    sector: "Sin datos comparables",
    region: meta.region,
    country: meta.country,
    score: null,
    coverage: 0,
    keys: [],
    latestPeriodEnd: null,
    source: null,
    analysisStatus: "unavailable",
  };
}

async function analyzeCompany(meta: ScreenerUniverseCompany): Promise<QualityScreenerCompany> {
  const cache = getCacheStore();
  const cacheKey = `quality-screener:v4:${meta.ticker}`;
  const cached = await cache.get<QualityScreenerCompany>(cacheKey);
  if (cached) return cached;

  const hit = await resolveTicker(meta.ticker);
  if (!hit) return unavailable(meta);

  try {
    const [bundle, prices] = await Promise.all([
      buildStatements(hit.cik, "annual", hit.name, meta.ticker),
      getCompactPriceSeries(meta.ticker),
    ]);
    if (!hasUsableData(bundle)) return unavailable(meta, hit.name);

    const historicalPe = buildHistoricalPeSeries(
      bundle,
      prices.ok ? prices.series : null,
      bundle.currency ?? "USD",
    );
    const scorecard = evaluateQualityScorecard(bundle, {
      historicalPe,
      splits: prices.ok ? prices.series.splits : undefined,
    });
    const result: QualityScreenerCompany = {
      ticker: meta.ticker,
      name: bundle.profile.name || hit.name,
      sector: bundle.profile.sicDescription || bundle.profile.sector || "No clasificado",
      region: meta.region,
      country: meta.country,
      score: scorecard.score,
      coverage: scorecard.coverage,
      keys: scorecard.items.map((item) => ({
        id: item.id,
        name: item.name,
        status: item.status,
        value: item.valueFormatted,
      })),
      latestPeriodEnd: bundle.latestPeriodEnd,
      source: bundle.source?.label ?? null,
      analysisStatus: "available",
    };
    await cache.set(cacheKey, result, TTL.qualityScreener);
    return result;
  } catch {
    return unavailable(meta, hit.name);
  }
}

export async function getQualityScreenerBatch(offset: number, limit: number): Promise<QualityScreenerBatch> {
  const safeOffset = Math.min(Math.max(0, Math.trunc(offset)), QUALITY_SCREENER_UNIVERSE.length);
  const safeLimit = Math.min(Math.max(1, Math.trunc(limit)), 10);
  const companies = QUALITY_SCREENER_UNIVERSE.slice(safeOffset, safeOffset + safeLimit);
  const items = await Promise.all(companies.map(analyzeCompany));
  const nextOffset = safeOffset + companies.length < QUALITY_SCREENER_UNIVERSE.length
    ? safeOffset + companies.length
    : null;
  return {
    items,
    offset: safeOffset,
    nextOffset,
    total: QUALITY_SCREENER_UNIVERSE.length,
  };
}

export { QUALITY_SCREENER_UNIVERSE } from "./universe";
