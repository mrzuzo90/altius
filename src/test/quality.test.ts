import { describe, expect, it } from "vitest";
import { evaluateQualityScorecard } from "@/lib/sec/quality";
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

describe("evaluateQualityScorecard", () => {
  const periods: Period[] = [
    { key: "FY2023", label: "FY 2023", end: "2023-09-30", fiscalYear: 2023, quarter: 4, derived: false },
    { key: "FY2022", label: "FY 2022", end: "2022-09-30", fiscalYear: 2022, quarter: 4, derived: false },
    { key: "FY2021", label: "FY 2021", end: "2021-09-30", fiscalYear: 2021, quarter: 4, derived: false },
  ];

  it("evalúa con puntuación excelente una empresa compounder con ROIC alto y caja neta", () => {
    const income = createDummyStatement(periods, {
      sharesDiluted: [95, 100, 105], // Recompras netas (baja de 105 a 95)
    });
    const balance = createDummyStatement(periods, {
      cash: [1000, 900, 800],
      shortTermInvestments: [500, 400, 300],
      longTermDebt: [300, 300, 300],
      shortTermDebt: [100, 100, 100], // Deuda total 400 < Caja total 1500 -> Caja Neta
    });
    const cashflow = createDummyStatement(periods, {});
    const ratios = createDummyStatement(periods, {
      roic: [28, 25, 24], // > 15%
      grossMargin: [45, 44, 43], // > 40%
      operatingMargin: [30, 28, 27], // > 15%
      fcfConversion: [85, 80, 78], // > 65%
      ebitda: [3500, 3200, 3000],
      revenueGrowthYoY: [12, 10, null], // > 8%
    });

    const bundle: StatementBundle = {
      profile: {
        cik: "0000320193",
        name: "Apple Inc",
        tickers: ["AAPL"],
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
        { id: "ratios", label: "Ratios", ...ratios },
      ],
      latestPeriodEnd: "2023-09-30",
    };

    const result = evaluateQualityScorecard(bundle);

    expect(result.score).toBe(6);
    expect(result.maxScore).toBe(6);
    expect(result.verdict).toContain("Excelente");
    expect(result.items.every((i) => i.status === "pass")).toBe(true);
  });
});
