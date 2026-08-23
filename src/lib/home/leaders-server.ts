import { getLiveQuote } from "@/lib/quotes/client";
import { MARKET_LEADER_CONFIGS, type MarketLeader } from "./leaders-data";

/**
 * Obtiene los líderes de mercado con sus cotizaciones y sparklines reales en tiempo real desde el servidor.
 */
export async function getDynamicMarketLeaders(): Promise<MarketLeader[]> {
  const leaders = await Promise.all(
    MARKET_LEADER_CONFIGS.map(async (meta) => {
      const quote = await getLiveQuote(meta.ticker);

      return {
        ticker: meta.ticker,
        name: meta.name,
        sector: meta.sector,
        region: meta.region,
        country: meta.country,
        price: quote?.price ?? 0,
        changePct: quote?.changePct ?? 0,
        marketCap: quote?.marketCap ?? 0,
        pe: meta.pe ?? null,
        evEbitda: meta.evEbitda ?? null,
        fcfMargin: meta.fcfMargin ?? null,
        roic: meta.roic ?? null,
        revenueGrowth: meta.revenueGrowth ?? null,
        trend: quote?.sparkline ?? [],
      };
    }),
  );

  return leaders;
}
