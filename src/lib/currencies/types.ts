import type { PricePoint } from "@/lib/prices/types";
import type { TechnicalDataset } from "@/lib/technical/types";

export type CurrencyPairSymbol =
  | "EURUSD"
  | "GBPUSD"
  | "USDJPY"
  | "USDCHF"
  | "USDCAD"
  | "AUDUSD"
  | "USDCNY"
  | "USDMXN"
  | "DXY";

export type CurrencyPairMeta = {
  symbol: CurrencyPairSymbol;
  slug: string;
  name: string;
  shortName: string;
  baseCurrency: string;
  quoteCurrency: string;
  fredSeriesId: string;
  marketSymbol?: string;
  provider: string;
  description: string;
  isIndex?: boolean;
};

export type CurrencySummary = {
  symbol: CurrencyPairSymbol;
  slug: string;
  name: string;
  shortName: string;
  baseCurrency: string;
  quoteCurrency: string;
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

export type CurrencyDetailResult = {
  meta: CurrencyPairMeta;
  summary: CurrencySummary;
  technical: TechnicalDataset;
  points: PricePoint[];
};
