import type { PricePoint } from "@/lib/prices/types";
import type { TechnicalDataset } from "@/lib/technical/types";

export type MarketIndexSymbol = "SP500" | "NASDAQCOM" | "DJIA" | "VIXCLS";

export type MarketIndexMeta = {
  symbol: MarketIndexSymbol;
  slug: string;
  name: string;
  shortName: string;
  fredSeriesId: string;
  provider: string;
  description: string;
  isVolatilityIndex?: boolean;
  benchmarkTicker?: string; // ETF ticker if applicable, e.g., SPY, QQQ, DIA
};

export type IndexSummary = {
  symbol: MarketIndexSymbol;
  name: string;
  shortName: string;
  currentValue: number;
  date: string;
  change1D?: number;
  change1W?: number;
  change1M?: number;
  change1Y?: number;
  change5Y?: number;
  changeYTD?: number;
  high52w: number;
  low52w: number;
  ath: number;
  athDate: string;
  drawdownFromAthPct: number;
  annualizedVolatilityPct: number;
  recentSparkline: number[];
  provider: string;
};

export type IndexDetailResult = {
  meta: MarketIndexMeta;
  summary: IndexSummary;
  technical: TechnicalDataset;
  points: PricePoint[];
};
