import { describe, expect, it } from "vitest";
import { buildValuationMetrics, calculateProjection } from "@/lib/valuation";
import type { StatementBundle } from "@/lib/sec/statements";
import type { NormalizedStatement, Period, LineSeries } from "@/lib/sec/normalize";

function createDummyStatement(
  periods: Period[],
  rowsData: Record<string, (number | null)[]>,
): NormalizedStatement {
  const rows: LineSeries[] = Object.entries(rowsData).map(([id, values]) => ({
    line: { id, label: id, concepts: [], kind: "duration", unit: "USD" },
    cells: Object.fromEntries(
      periods.map((p, idx) => [p.key, { value: values[idx], derived: false }]),
    ),
  }));
  return { periods, rows };
}

describe("buildValuationMetrics y calculateProjection", () => {
  const periods: Period[] = [
    { key: "FY2023", label: "FY 2023", end: "2023-09-30", fiscalYear: 2023, quarter: 4, derived: false },
  ];

  const income = createDummyStatement(periods, {
    revenue: [10000],
    operatingIncome: [3000],
    pretaxIncome: [2900],
    incomeTax: [580],
    netIncome: [2320],
    sharesDiluted: [100], // 100M de acciones
  });

  const balance = createDummyStatement(periods, {
    cash: [800],
    shortTermInvestments: [200], // Total Cash = 1000
    longTermDebt: [1200],
    shortTermDebt: [300], // Total Debt = 1500 -> Net Debt = 500
  });

  const cashflow = createDummyStatement(periods, {
    depreciation: [500], // EBITDA = 3000 + 500 = 3500
    freeCashFlow: [2450],
  });

  const bundle: StatementBundle = {
    profile: {
      cik: "0000320193",
      name: "Test Corp",
      tickers: ["TEST"],
      sector: "Technology",
      sic: "3571",
      sicDescription: "Computers",
      exchanges: ["NASDAQ"],
      fiscalYearEnd: "0930",
      website: null,
      address: null,
      stateOfIncorporation: "CA",
    },
    frequency: "annual",
    blocks: [
      { id: "income", label: "Income", ...income },
      { id: "balance", label: "Balance", ...balance },
      { id: "cashflow", label: "Cash Flow", ...cashflow },
    ],
    latestPeriodEnd: "2023-09-30",
  };

  it("calcula correctamente Market Cap, Deuda Neta, Enterprise Value y múltiplos LTM", () => {
    const price = 50; //  por acción
    const metrics = buildValuationMetrics(bundle, price, "2023-10-01");

    // Market Cap = 50 * 100 = 5000
    expect(metrics.marketCap).toBe(5000);
    // Total Cash = 800 + 200 = 1000
    expect(metrics.totalCash).toBe(1000);
    // Total Debt = 1200 + 300 = 1500
    expect(metrics.totalDebt).toBe(1500);
    // Net Debt = 1500 - 1000 = 500
    expect(metrics.netDebt).toBe(500);
    // Enterprise Value = 5000 + 500 = 5500
    expect(metrics.enterpriseValue).toBe(5500);

    // Múltiplos:
    // PER = 5000 / 2320 = 2.155
    expect(metrics.pe).toBeCloseTo(5000 / 2320);
    // EV / EBITDA = 5500 / 3500 = 1.5714
    expect(metrics.evEbitda).toBeCloseTo(5500 / 3500);
    // EV / EBIT = 5500 / 3000 = 1.8333
    expect(metrics.evEbit).toBeCloseTo(5500 / 3000);
    // EV / FCF = 5500 / 2450 = 2.2448
    expect(metrics.evFcf).toBeCloseTo(5500 / 2450);
    // Deuda Neta / EBITDA = 500 / 3500 = 0.1428
    expect(metrics.netDebtEbitda).toBeCloseTo(500 / 3500);
    // FCF Yield = (2450 / 5000) * 100 = 49%
    expect(metrics.fcfYield).toBeCloseTo(49);
  });

  it("proyecta a 5 años y calcula el precio objetivo, margen de seguridad y CAGR", () => {
    const price = 50;
    const metrics = buildValuationMetrics(bundle, price);

    const projection = calculateProjection(metrics, {
      revenueGrowth: 10,       // 10% anual
      targetEbitMargin: 30,    // 30% margen EBIT
      targetMultiple: 15,      // PER 15x
      targetMultipleType: "PE",
      taxRate: 20,             // 20% tax
      sharesGrowth: 0,         // 0% dilución
    });

    expect(projection.years).toHaveLength(5);
    // Año 1: Rev = 10000 * 1.10 = 11000
    expect(projection.years[0].revenue).toBeCloseTo(11000);
    // EBIT = 11000 * 0.30 = 3300
    expect(projection.years[0].ebit).toBeCloseTo(3300);
    // Net Income = 3300 * 0.80 = 2640
    expect(projection.years[0].netIncome).toBeCloseTo(2640);
    // Market Cap = 2640 * 15 = 39600
    expect(projection.years[0].targetMarketCap).toBeCloseTo(39600);
    // Target Price = 39600 / 100 = 396
    expect(projection.years[0].targetPrice).toBeCloseTo(396);

    // Al año 5:
    expect(projection.targetPrice5Y).toBeGreaterThan(price);
    expect(projection.marginOfSafety).toBeGreaterThan(0);
    expect(projection.cagr5Y).toBeGreaterThan(0);
  });
});
