export type ValuationMetrics = {
  price: number;
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
  historicalEbitMargin: number | null;
  historicalFcfConversion: number | null;
  historicalTaxRate: number | null;
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
  fcf: number;
  sharesDiluted: number;
  targetMarketCap: number;
  targetPrice: number;
};

export type ValuationProjection = {
  years: ProjectedYear[];
  currentPrice: number;
  targetPrice5Y: number;
  marginOfSafety: number;       // en porcentaje, ej: 25.4 (%)
  cagr5Y: number;               // retorno anual compuesto esperado en %, ej: 14.8 (%)
};
