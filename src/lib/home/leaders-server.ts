import { getLiveQuote } from "@/lib/quotes/client";
import { buildStatements, hasUsableData, type StatementBundle } from "@/lib/sec/statements";
import { buildValuationMetrics } from "@/lib/valuation";
import { convertPriceSeriesCurrency } from "@/lib/prices/fx";
import type { PriceSeries } from "@/lib/prices";
import { supplementAnnualStatements } from "@/lib/financials/yahoo-supplement";
import { resolveEsefCompanyDynamic } from "@/lib/esef/resolve";
import { buildEsefStatements } from "@/lib/esef";
import {
  MARKET_LEADER_CONFIGS,
  type MarketLeader,
  type MarketLeaderMeta,
} from "./leaders-data";

export type MarketLeaderFundamentals = Pick<
  MarketLeader,
  "marketCap" | "fundamentalCurrency" | "pe" | "evEbitda" | "fcfMargin" | "roic" | "revenueGrowth"
>;

function latestValue(bundle: StatementBundle, blockId: string, lineId: string): number | null {
  const block = bundle.blocks.find((candidate) => candidate.id === blockId);
  const period = block?.periods[0];
  if (!block || !period) return null;
  const value = block.rows.find((row) => row.line.id === lineId)?.cells[period.key]?.value;
  return value !== null && value !== undefined && Number.isFinite(value) ? value : null;
}

function isFinancialCompany(meta: MarketLeaderMeta): boolean {
  return /bank|financ|insurance/i.test(meta.sector);
}

async function officialStatementsFor(meta: MarketLeaderMeta): Promise<StatementBundle | null> {
  if (meta.cik) return buildStatements(meta.cik, "annual", meta.name, meta.ticker);
  const esefCompany = await resolveEsefCompanyDynamic(meta.ticker);
  return esefCompany ? buildEsefStatements(esefCompany, "annual") : null;
}

export function buildMarketLeaderFundamentals(
  bundle: StatementBundle,
  priceInReportingCurrency: number | null,
  priceDate: string | null,
): MarketLeaderFundamentals {
  const metrics = buildValuationMetrics(bundle, priceInReportingCurrency, priceDate);
  const ratioFcfMargin = latestValue(bundle, "ratios", "fcfMargin");
  const ratioRoic = latestValue(bundle, "ratios", "roic");
  const ratioRevenueGrowth = latestValue(bundle, "ratios", "revenueGrowthYoY");
  const calculatedFcfMargin = metrics.freeCashFlow !== null
    && metrics.revenue !== null
    && metrics.revenue > 0
    ? (metrics.freeCashFlow / metrics.revenue) * 100
    : null;

  return {
    marketCap: metrics.marketCap !== null ? metrics.marketCap / 1_000_000 : null,
    fundamentalCurrency: metrics.currency,
    pe: metrics.pe,
    evEbitda: metrics.evEbitda,
    fcfMargin: ratioFcfMargin ?? calculatedFcfMargin,
    roic: ratioRoic,
    revenueGrowth: ratioRevenueGrowth ?? metrics.historicalRevenueGrowth,
  };
}

async function fundamentalsFor(
  meta: MarketLeaderMeta,
  quote: Awaited<ReturnType<typeof getLiveQuote>>,
): Promise<MarketLeaderFundamentals | null> {
  if (!quote) return null;
  try {
    let bundle = await officialStatementsFor(meta);
    if (!bundle) return null;
    if (!hasUsableData(bundle)) return null;

    const quoteSeries: PriceSeries = {
      ticker: meta.ticker,
      points: [{ date: quote.date, close: quote.price }],
      currency: quote.currency,
      source: quote.source,
    };
    const priceFor = async (statements: StatementBundle) => {
      const converted = await convertPriceSeriesCurrency(quoteSeries, statements.currency ?? quote.currency);
      const convertedPrice = converted?.points.at(-1)?.close ?? null;
      const sharesPerListing = meta.sharesPerListing ?? 1;
      return convertedPrice !== null && sharesPerListing > 0
        ? convertedPrice / sharesPerListing
        : null;
    };
    let pricePerReportedShare = await priceFor(bundle);
    let result = buildMarketLeaderFundamentals(bundle, pricePerReportedShare, quote.date);

    if (isFinancialCompany(meta)) {
      return {
        ...result,
        evEbitda: null,
        fcfMargin: null,
        roic: latestValue(bundle, "ratios", "roe"),
        revenueGrowth: null,
      };
    }

    if ([result.evEbitda, result.fcfMargin, result.roic, result.revenueGrowth].some((value) => value === null)) {
      bundle = await supplementAnnualStatements(bundle, meta);
      pricePerReportedShare = await priceFor(bundle);
      result = buildMarketLeaderFundamentals(bundle, pricePerReportedShare, quote.date);
    }
    return result;
  } catch {
    return null;
  }
}

/**
 * Obtiene los líderes de mercado con sus cotizaciones y sparklines reales en tiempo real desde el servidor.
 */
export async function getDynamicMarketLeaders(): Promise<MarketLeader[]> {
  const leaders = await Promise.all(
    MARKET_LEADER_CONFIGS.map(async (meta) => {
      const quote = await getLiveQuote(meta.ticker);
      const fundamentals = await fundamentalsFor(meta, quote);

      return {
        ticker: meta.ticker,
        name: meta.name,
        sector: meta.sector,
        region: meta.region,
        country: meta.country,
        price: quote?.price ?? null,
        priceCurrency: quote?.currency ?? null,
        changePct: quote?.changePct ?? null,
        marketCap: fundamentals?.marketCap ?? meta.marketCapBase ?? null,
        fundamentalCurrency: fundamentals?.fundamentalCurrency ?? null,
        pe: fundamentals?.pe ?? meta.pe ?? null,
        evEbitda: fundamentals?.evEbitda ?? meta.evEbitda ?? null,
        fcfMargin: fundamentals?.fcfMargin ?? meta.fcfMargin ?? null,
        roic: fundamentals?.roic ?? meta.roic ?? null,
        revenueGrowth: fundamentals?.revenueGrowth ?? meta.revenueGrowth ?? null,
        trend: quote?.sparkline ?? [],
      };
    }),
  );

  return leaders;
}
