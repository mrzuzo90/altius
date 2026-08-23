import type { PricePoint } from "@/lib/prices/types";
import type { TechnicalDataset } from "@/lib/technical/types";

export type CommodityCategory =
  | "energy"
  | "precious_metals"
  | "industrial_metals"
  | "agriculture";

export type CommoditySymbol =
  | "BRENT"
  | "WTI"
  | "NATGAS"
  | "GOLD"
  | "SILVER"
  | "COPPER"
  | "WHEAT"
  | "CORN";

export type CommodityMeta = {
  symbol: CommoditySymbol;
  slug: string;
  name: string;
  shortName: string;
  category: CommodityCategory;
  unit: string;
  fredSeriesId: string;
  provider: string;
  description: string;
};

export type CommoditySummary = {
  symbol: CommoditySymbol;
  slug: string;
  name: string;
  shortName: string;
  category: CommodityCategory;
  unit: string;
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

export type CommodityDetailResult = {
  meta: CommodityMeta;
  summary: CommoditySummary;
  technical: TechnicalDataset;
  points: PricePoint[];
};
