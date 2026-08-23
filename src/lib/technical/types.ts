export type IndicatorPoint = {
  date: string;
  close: number;
  sma20?: number | null;
  sma50?: number | null;
  sma200?: number | null;
  ema20?: number | null;
  ema50?: number | null;
  bollingerUpper?: number | null;
  bollingerMiddle?: number | null;
  bollingerLower?: number | null;
  bollingerPercentB?: number | null;
  bollingerBandwidth?: number | null;
  rsi14?: number | null;
  macdLine?: number | null;
  macdSignal?: number | null;
  macdHistogram?: number | null;
};

export type TechnicalBias = "strong_bullish" | "bullish" | "neutral" | "bearish" | "strong_bearish";

export type TechnicalSignal = {
  indicator: string;
  value: string;
  label: string;
  bias: TechnicalBias;
  description: string;
};

export type SupportResistanceLevel = {
  price: number;
  type: "support" | "resistance";
  distancePct: number;
  strength: number; // 1-3
};

export type TechnicalStats = {
  currentPrice: number;
  priceChange1D?: number;
  priceChange1W?: number;
  priceChange1M?: number;
  priceChange1Y?: number;
  high52w: number;
  low52w: number;
  distanceFrom52wHighPct: number;
  distanceFrom52wLowPct: number;
  annualizedVolatilityPct: number;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  rsi14: number | null;
  macdLine: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  bollingerUpper: number | null;
  bollingerLower: number | null;
  bollingerMiddle: number | null;
  supports: SupportResistanceLevel[];
  resistances: SupportResistanceLevel[];
  signals: TechnicalSignal[];
  overallBias: TechnicalBias;
  summaryText: string;
};

export type TechnicalDataset = {
  points: IndicatorPoint[];
  stats: TechnicalStats;
  source: string;
  ticker: string;
};
