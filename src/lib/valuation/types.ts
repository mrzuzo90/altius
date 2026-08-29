export type HistoricalMetricCoverage = {
  observations: number;
  startFiscalYear: number | null;
  endFiscalYear: number | null;
};

export type ValuationMetrics = {
  currency: string;
  price: number | null;
  priceDate: string | null;
  sharesDiluted: number | null;
  marketCap: number | null;
  totalCash: number | null;
  totalDebt: number | null;
  netDebt: number | null;
  enterpriseValue: number | null;

  // LTM / Último ejercicio magnitudes
  revenue: number | null;
  ebit: number | null;
  ebitda: number | null;
  netIncome: number | null;
  freeCashFlow: number | null;

  // Múltiplos
  pe: number | null;
  evEbitda: number | null;
  evEbit: number | null;
  evFcf: number | null;
  netDebtEbitda: number | null;
  fcfYield: number | null;

  // Márgenes y retornos base para proyecciones
  historicalRevenueGrowth: number | null;
  historicalRevenueGrowthCoverage: HistoricalMetricCoverage;
  historicalEbitMargin: number | null;
  historicalEbitMarginCoverage: HistoricalMetricCoverage;
  historicalFcfConversion: number | null;
  historicalDepreciationMargin: number | null;
  historicalTaxRate: number | null;
  historicalTaxRateCoverage: HistoricalMetricCoverage;
  lastFiscalYear: number | null;
};

export type ProjectionInputs = {
  revenueGrowth: number;        // en porcentaje, ej: 12 (%)
  targetEbitMargin: number;     // en porcentaje, ej: 28 (%)
  targetMultiple: number;       // múltiplo de salida, ej: 22 (x)
  targetMultipleType: "PE" | "EV_FCF" | "EV_EBITDA";
  taxRate: number;              // en porcentaje, ej: 21 (%)
  sharesGrowth: number;         // en porcentaje anual, ej: 0 (%)
};

export type ProjectedYear = {
  yearIndex: number;
  label: string;                // "2024e", "2025e", etc.
  revenue: number;
  ebit: number;
  netIncome: number;
  fcf: number | null;
  sharesDiluted: number;
  targetMarketCap: number | null;
  targetPrice: number | null;
};

export type ValuationProjection = {
  years: ProjectedYear[];
  currentPrice: number | null;
  targetPrice5Y: number | null;
  marginOfSafety: number | null;
  cagr5Y: number | null;
  unavailableReason: string | null;
};

export type ImpliedExpectations = {
  revenueGrowth: number | null;
  reason: string | null;
};
