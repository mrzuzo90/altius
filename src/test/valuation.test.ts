import { describe, expect, it } from "vitest";
import { buildValuationMetrics, calculateImpliedExpectations, calculateProjection } from "@/lib/valuation";
import type { StatementBundle } from "@/lib/sec/statements";
import type { NormalizedStatement, Period, LineSeries } from "@/lib/sec/normalize";

function createDummyStatement(
  periods: Period[],
  rowsData: Record<string, (number | null)[]>,
): NormalizedStatement {
  const rows: LineSeries[] = Object.entries(rowsData).map(([id, values]) => ({
    line: { id, label: id, concepts: [], kind: "duration", unit: "USD" },
    cells: Object.fromEntries(
      periods.map((p, idx) => [
        p.key,
        { value: values[idx], derived: false, provenance: { kind: "absent" as const } },
      ]),
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

  it("calcula correctamente Market Cap, Deuda Neta, Enterprise Value y múltiplos del último FY", () => {
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

  it("usa acciones de cierre y conserva el total más completo de deuda y liquidez", () => {
    const balanceWithAggregates = createDummyStatement(periods, {
      sharesOutstanding: [90],
      cash: [800],
      shortTermInvestments: [200],
      cashAndShortTermInvestments: [900],
      longTermDebt: [1200],
      shortTermDebt: [300],
      totalDebt: [1000],
    });
    const bundleWithAggregates: StatementBundle = {
      ...bundle,
      blocks: bundle.blocks.map((block) => block.id === "balance"
        ? { id: "balance", label: "Balance", ...balanceWithAggregates }
        : block),
    };

    const metrics = buildValuationMetrics(bundleWithAggregates, 50);

    expect(metrics.marketCap).toBe(4_500);
    expect(metrics.totalCash).toBe(1_000);
    expect(metrics.totalDebt).toBe(1_500);
    expect(metrics.netDebt).toBe(500);
  });

  it("usa medianas de los últimos 20 años y no el último ejercicio como referencia", () => {
    const years = Array.from({ length: 21 }, (_, index) => 2024 - index);
    const historicalPeriods: Period[] = years.map((year) => ({
      key: `FY${year}`,
      label: `FY ${year}`,
      end: `${year}-12-31`,
      fiscalYear: year,
      quarter: 4,
      derived: false,
    }));
    const revenueByYear = new Map(
      Array.from({ length: 21 }, (_, index) => {
        const year = 2004 + index;
        const ordinary = 100 * Math.pow(1.1, index);
        return [year, year === 2024 ? ordinary * 2 : ordinary] as const;
      }),
    );
    const revenues = years.map((year) => revenueByYear.get(year)!);
    const operatingIncome = years.map((year) => revenues[years.indexOf(year)] * (year === 2024 ? 0.6 : year === 2004 ? 0.9 : 0.2));
    const pretaxIncome = revenues.map((value) => value * 0.25);
    const incomeTax = years.map((year, index) => pretaxIncome[index] * (year === 2024 ? 0.4 : year === 2004 ? 0.9 : 0.2));
    const historicalIncome = createDummyStatement(historicalPeriods, {
      revenue: revenues,
      operatingIncome,
      pretaxIncome,
      incomeTax,
      netIncome: pretaxIncome.map((value, index) => value - incomeTax[index]),
      sharesDiluted: years.map(() => 100),
    });
    const historicalBundle: StatementBundle = {
      ...bundle,
      blocks: [{ id: "income", label: "Income", ...historicalIncome }],
      latestPeriodEnd: "2024-12-31",
    };

    const metrics = buildValuationMetrics(historicalBundle, 50);

    expect(metrics.historicalRevenueGrowth).toBeCloseTo(10, 5);
    expect(metrics.historicalEbitMargin).toBeCloseTo(20, 5);
    expect(metrics.historicalTaxRate).toBeCloseTo(20, 5);
    expect(metrics.historicalRevenueGrowthCoverage.observations).toBe(20);
    expect(metrics.historicalEbitMarginCoverage).toMatchObject({ observations: 20, startFiscalYear: 2005, endFiscalYear: 2024 });
    expect(metrics.historicalTaxRateCoverage.observations).toBe(20);
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
    expect(projection.targetPrice5Y!).toBeGreaterThan(price);
    expect(projection.marginOfSafety!).toBeGreaterThan(0);
    expect(projection.cagr5Y!).toBeGreaterThan(0);
  });

  it("no inventa precio, ingresos ni acciones cuando faltan", () => {
    const emptyBundle: StatementBundle = { ...bundle, blocks: [], latestPeriodEnd: null };
    const metrics = buildValuationMetrics(emptyBundle, null);
    const projection = calculateProjection(metrics, {
      revenueGrowth: 8,
      targetEbitMargin: 20,
      targetMultiple: 15,
      targetMultipleType: "PE",
      taxRate: 21,
      sharesGrowth: 0,
    });
    expect(metrics.price).toBeNull();
    expect(projection.years).toEqual([]);
    expect(projection.targetPrice5Y).toBeNull();
    expect(projection.marginOfSafety).toBeNull();
  });

  it("calcula la expectativa de crecimiento implícita del precio", () => {
    const metrics = buildValuationMetrics(bundle, 50);
    const implied = calculateImpliedExpectations(metrics, {
      revenueGrowth: 0,
      targetEbitMargin: 30,
      targetMultiple: 15,
      targetMultipleType: "PE",
      taxRate: 20,
      sharesGrowth: 0,
    });
    expect(implied.reason).toBeNull();
    expect(implied.revenueGrowth).not.toBeNull();
  });
});
