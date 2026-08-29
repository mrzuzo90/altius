import { describe, expect, it } from "vitest";
import { buildQuarterlyPeSeries } from "@/lib/valuation/quarterly-pe";
import type { StatementBundle } from "@/lib/sec/statements";

const provenance = (filed: string) => ({
  kind: "reported" as const,
  concept: "EarningsPerShareDiluted",
  unit: "USD/shares",
  periodStart: null,
  periodEnd: filed,
  form: "10-Q",
  filed,
  accn: filed,
});

const periods = [
  { key: "2024Q1", label: "Q1 2024", end: "2024-03-31", fiscalYear: 2024, quarter: 1, derived: false },
  { key: "2023Q4", label: "Q4 2023", end: "2023-12-31", fiscalYear: 2023, quarter: 4, derived: true },
  { key: "2023Q3", label: "Q3 2023", end: "2023-09-30", fiscalYear: 2023, quarter: 3, derived: false },
  { key: "2023Q2", label: "Q2 2023", end: "2023-06-30", fiscalYear: 2023, quarter: 2, derived: false },
  { key: "2023Q1", label: "Q1 2023", end: "2023-03-31", fiscalYear: 2023, quarter: 1, derived: false },
];

const filings: Record<string, string> = {
  "2023Q1": "2023-04-28",
  "2023Q2": "2023-07-28",
  "2023Q3": "2023-10-27",
  "2023Q4": "2024-02-02",
  "2024Q1": "2024-04-26",
};

const firstEps: Record<string, number> = {
  "2023Q1": 1,
  "2023Q2": 1,
  "2023Q3": 1,
  "2023Q4": 1,
  "2024Q1": 2,
};

const bundle: StatementBundle = {
  profile: {
    cik: "1",
    name: "Quarterly Test",
    tickers: ["QTR"],
    exchanges: ["NYSE"],
    sic: "",
    sicDescription: "",
    sector: "",
    fiscalYearEnd: "1231",
    website: null,
    address: null,
    stateOfIncorporation: null,
  },
  frequency: "quarterly",
  latestPeriodEnd: "2024-03-31",
  currency: "USD",
  blocks: [{
    id: "income",
    label: "Cuenta de resultados",
    periods,
    rows: [{
      line: { id: "epsDiluted", label: "BPA diluido", concepts: [], unit: "USD/shares", kind: "duration" },
      cells: Object.fromEntries(periods.map((period) => [period.key, {
        // Simula una reexpresión posterior: el cálculo histórico debe ignorarla.
        value: firstEps[period.key] + 10,
        derived: period.derived,
        provenance: provenance("2025-01-01"),
        firstReported: { value: firstEps[period.key], filed: filings[period.key] },
      }])),
    }],
  }],
};

describe("PER histórico por presentación trimestral", () => {
  it("calcula BPA TTM y precio point-in-time en cada fecha de presentación", () => {
    const series = buildQuarterlyPeSeries(bundle, {
      ticker: "QTR",
      currency: "USD",
      source: "test",
      points: [
        { date: "2023-04-27", close: 10 },
        { date: "2023-07-27", close: 20 },
        { date: "2023-10-26", close: 30 },
        { date: "2024-02-01", close: 40 },
        { date: "2024-04-25", close: 60 },
      ],
    });

    expect(series.points.slice(0, 3).every((point) => point.pe === null)).toBe(true);
    expect(series.points[3]).toMatchObject({
      periodKey: "2023Q4",
      earningsKnownAt: "2024-02-02",
      priceDate: "2024-02-01",
      eps: 4,
      pe: 10,
    });
    expect(series.points[4]).toMatchObject({ periodKey: "2024Q1", eps: 5, pe: 12 });
    expect(series.lastPe).toBe(12);
    expect(series.median).toBe(11);
    expect(series.min).toBe(10);
    expect(series.max).toBe(12);
    expect(series.reason).toBeNull();
  });
});
