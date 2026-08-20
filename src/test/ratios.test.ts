import { describe, expect, it } from "vitest";
import { buildRatiosStatement } from "@/lib/sec/ratios";
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

describe("buildRatiosStatement", () => {
  const periods: Period[] = [
    { key: "FY2023", label: "FY 2023", end: "2023-09-30", fiscalYear: 2023, quarter: 4, derived: false },
    { key: "FY2022", label: "FY 2022", end: "2022-09-30", fiscalYear: 2022, quarter: 4, derived: false },
  ];

  it("calcula márgenes operativos, brutos y netos correctamente", () => {
    const income = createDummyStatement(periods, {
      revenue: [1000, 800],
      grossProfit: [400, 300],
      operatingIncome: [300, 200],
      pretaxIncome: [280, 190],
      incomeTax: [56, 38],
      netIncome: [224, 152],
      epsDiluted: [2.24, 1.52],
    });

    const balance = createDummyStatement(periods, {
      equity: [1000, 800],
      totalAssets: [2000, 1600],
      cash: [200, 150],
      shortTermInvestments: [100, 50],
      longTermDebt: [400, 300],
      shortTermDebt: [100, 50],
    });

    const cashflow = createDummyStatement(periods, {
      depreciation: [50, 40],
      freeCashFlow: [250, 180],
    });

    const ratios = buildRatiosStatement(income, balance, cashflow, "annual");

    const getVal = (id: string, periodKey: string) =>
      ratios.rows.find((r) => r.line.id === id)?.cells[periodKey]?.value;

    // Márgenes 2023:
    // Gross: 400 / 1000 = 40%
    expect(getVal("grossMargin", "FY2023")).toBeCloseTo(40);
    // EBITDA: 300 + 50 = 350
    expect(getVal("ebitda", "FY2023")).toBeCloseTo(350);
    // EBITDA margin: 350 / 1000 = 35%
    expect(getVal("ebitdaMargin", "FY2023")).toBeCloseTo(35);
    // Operating margin: 300 / 1000 = 30%
    expect(getVal("operatingMargin", "FY2023")).toBeCloseTo(30);
    // Net margin: 224 / 1000 = 22.4%
    expect(getVal("netMargin", "FY2023")).toBeCloseTo(22.4);
    // FCF margin: 250 / 1000 = 25%
    expect(getVal("fcfMargin", "FY2023")).toBeCloseTo(25);

    // Retornos:
    // ROE: 224 / 1000 = 22.4%
    expect(getVal("roe", "FY2023")).toBeCloseTo(22.4);
    // ROA: 224 / 2000 = 11.2%
    expect(getVal("roa", "FY2023")).toBeCloseTo(11.2);
    // Tax rate: 56 / 280 = 20%
    expect(getVal("effectiveTaxRate", "FY2023")).toBeCloseTo(20);

    // ROIC:
    // NOPAT = 300 * (1 - 0.20) = 240
    // Total Debt = 400 + 100 = 500
    // Total Cash = 200 + 100 = 300
    // Invested Capital = 1000 + 500 - 300 = 1200
    // ROIC = 240 / 1200 = 20%
    expect(getVal("roic", "FY2023")).toBeCloseTo(20);

    // Conversión de caja: 250 / 350 = 71.428%
    expect(getVal("fcfConversion", "FY2023")).toBeCloseTo(71.428, 2);

    // Crecimientos YoY en FY2023:
    // Rev: (1000 - 800) / 800 = 25%
    expect(getVal("revenueGrowthYoY", "FY2023")).toBeCloseTo(25);
    // EPS: (2.24 - 1.52) / 1.52 = 47.368%
    expect(getVal("epsGrowthYoY", "FY2023")).toBeCloseTo(47.368, 2);
    // FCF: (250 - 180) / 180 = 38.888%
    expect(getVal("fcfGrowthYoY", "FY2023")).toBeCloseTo(38.888, 2);

    // El primer periodo no tiene previo, debe ser null
    expect(getVal("revenueGrowthYoY", "FY2022")).toBeNull();
  });

  it("calcula crecimientos YoY trimestrales comparando contra el mismo trimestre del año previo", () => {
    const qPeriods: Period[] = [
      { key: "2024Q3", label: "Q3 2024", end: "2024-06-30", fiscalYear: 2024, quarter: 3, derived: false },
      { key: "2024Q2", label: "Q2 2024", end: "2024-03-31", fiscalYear: 2024, quarter: 2, derived: false },
      { key: "2023Q3", label: "Q3 2023", end: "2023-06-30", fiscalYear: 2023, quarter: 3, derived: false },
    ];

    const income = createDummyStatement(qPeriods, {
      revenue: [110, 105, 100],
    });
    const balance = createDummyStatement(qPeriods, {});
    const cashflow = createDummyStatement(qPeriods, {});

    const ratios = buildRatiosStatement(income, balance, cashflow, "quarterly");
    const getVal = (id: string, periodKey: string) =>
      ratios.rows.find((r) => r.line.id === id)?.cells[periodKey]?.value;

    // 2024Q3 vs 2023Q3: (110 - 100) / 100 = 10%
    expect(getVal("revenueGrowthYoY", "2024Q3")).toBeCloseTo(10);
    // 2024Q2 no tiene 2023Q2 en los periodos suministrados -> null
    expect(getVal("revenueGrowthYoY", "2024Q2")).toBeNull();
  });
});
