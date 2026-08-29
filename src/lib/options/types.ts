export type OptionSide = "call" | "put";

export type OptionContractQuote = {
  symbol: string;
  side: OptionSide;
  expiration: string;
  strike: number;
  bid: number | null;
  ask: number | null;
  bidSize: number | null;
  askSize: number | null;
  last: number | null;
  volume: number;
  openInterest: number;
  impliedVolatility: number | null;
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
  underlyingPrice: number | null;
  updatedAt: string | null;
};

export type OptionSideSnapshot = {
  symbol: string;
  bid: number | null;
  ask: number | null;
  bidSize: number | null;
  askSize: number | null;
  last: number | null;
  volume: number;
  openInterest: number;
  impliedVolatility: number | null;
  delta: number | null;
  gamma: number | null;
};

export type OptionStrikeSnapshot = {
  strike: number;
  distancePct: number;
  call: OptionSideSnapshot | null;
  put: OptionSideSnapshot | null;
};

export type OptionWall = {
  strike: number;
  openInterest: number;
};

export type UnusualOptionActivity = {
  symbol: string;
  side: OptionSide;
  strike: number;
  volume: number;
  openInterest: number;
  volumeToOpenInterest: number;
  impliedVolatility: number | null;
};

export type OptionPressureLabel =
  | "Fuerte inclinación compradora"
  | "Inclinación compradora"
  | "Equilibrio"
  | "Inclinación vendedora"
  | "Fuerte inclinación vendedora";

export type OptionExpirationAnalysis = {
  expiration: string;
  daysToExpiration: number;
  asOf: string | null;
  contractCount: number;
  callVolume: number;
  putVolume: number;
  callOpenInterest: number;
  putOpenInterest: number;
  putCallVolumeRatio: number | null;
  putCallOpenInterestRatio: number | null;
  displayedBookImbalancePct: number | null;
  pressureScore: number;
  pressureLabel: OptionPressureLabel;
  pressureConfidence: "Baja" | "Media" | "Alta";
  expectedMove: number | null;
  expectedMovePct: number | null;
  expectedRangeLow: number | null;
  expectedRangeHigh: number | null;
  expectedMoveMethod: "Straddle ATM" | "Volatilidad implícita" | null;
  atmStrike: number | null;
  maxPain: number | null;
  callWall: OptionWall | null;
  putWall: OptionWall | null;
  strikes: OptionStrikeSnapshot[];
  unusualActivity: UnusualOptionActivity[];
  observations: string[];
};

export type OptionsAnalysisReady = {
  status: "ready";
  ticker: string;
  provider: string;
  providerHref: string;
  freshness: string;
  coverage: string;
  asOf: string | null;
  underlyingPrice: number;
  expirations: OptionExpirationAnalysis[];
};

export type OptionsAnalysisUnavailable = {
  status: "unavailable";
  ticker: string;
  reason: "not-configured" | "not-supported" | "rate-limited" | "not-found" | "provider-error";
  message: string;
};

export type OptionsMarketAnalysis = OptionsAnalysisReady | OptionsAnalysisUnavailable;
