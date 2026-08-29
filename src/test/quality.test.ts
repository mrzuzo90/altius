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
      revenue: [1440, 1200, 1000],
      netIncome: [300, 250, 200],
      epsDiluted: [3, 2.5, 2],
      sharesDiluted: [95, 100, 105], // Recompras netas (baja de 105 a 95)
    });
    const balance = createDummyStatement(periods, {
      cash: [1000, 900, 800],
      shortTermInvestments: [500, 400, 300],
      longTermDebt: [300, 300, 300],
      shortTermDebt: [100, 100, 100], // Deuda total 400 < Caja total 1500 -> Caja Neta
    });
    const cashflow = createDummyStatement(periods, {
      operatingCashFlow: [400, 350, 300],
      freeCashFlow: [330, 290, 240],
    });
    const ratios = createDummyStatement(periods, {
      roic: [28, 25, 24], // > 15%
      ebitda: [350, 320, 300],
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

    const result = evaluateQualityScorecard(bundle, {
      historicalPe: {
        points: [],
        currentPe: 18,
        currentPrice: 54,
        latestEps: 3,
        median10Y: 22,
        median20Y: 22,
        medianAll: 22,
        premiumToMedian10Y: -18.18,
        premiumToMedian20Y: -18.18,
        observations20Y: 10,
        startFiscalYear20Y: 2014,
        endFiscalYear20Y: 2023,
        comparableCurrency: true,
        reason: null,
      },
    });

    expect(result.score).toBe(6);
    expect(result.maxScore).toBe(6);
    expect(result).not.toHaveProperty("verdict");
    expect(result).not.toHaveProperty("mood");
    expect(result.items.every((i) => i.status === "pass")).toBe(true);
  });

  it("mantiene siempre el denominador en seis y separa la cobertura", () => {
    const empty = createDummyStatement(periods, {});
    const bundle: StatementBundle = {
      profile: {
        cik: "1", name: "Sin datos", tickers: [], exchanges: [], sector: "",
        sic: "", sicDescription: "", fiscalYearEnd: null, website: null,
        address: null, stateOfIncorporation: null,
      },
      frequency: "annual",
      blocks: [
        { id: "income", label: "Income", ...empty },
        { id: "balance", label: "Balance", ...empty },
        { id: "ratios", label: "Ratios", ...empty },
      ],
      latestPeriodEnd: null,
    };
    const result = evaluateQualityScorecard(bundle);
    expect(result.maxScore).toBe(6);
    expect(result.coverage).toBe(0);
    expect(result).not.toHaveProperty("verdictDescription");
    expect(result.items.every((item) => item.status === "unknown")).toBe(true);
  });

  it("usa capital y beneficio estable en bancos en vez de deuda/EBITDA y FCF", () => {
    const income = createDummyStatement(periods, {
      revenue: [130, 115, 100],
      netIncome: [24, 21, 18],
      epsDiluted: [2.4, 2.1, 1.8],
      sharesDiluted: [100, 100, 100],
    });
    const balance = createDummyStatement(periods, {
      totalAssets: [1000, 900, 800],
      equity: [90, 81, 72],
    });
    const ratios = createDummyStatement(periods, { roe: [16, 15, 14] });
    const empty = createDummyStatement(periods, {});
    const bundle: StatementBundle = {
      profile: {
        cik: "2", name: "Banco de prueba", tickers: ["BNK"], exchanges: ["BME"], sector: "Banks",
        sic: "6021", sicDescription: "National Commercial Banks", fiscalYearEnd: null, website: null,
        address: null, stateOfIncorporation: null,
      },
      frequency: "annual",
      blocks: [
        { id: "income", label: "Income", ...income },
        { id: "balance", label: "Balance", ...balance },
        { id: "cashflow", label: "Cash Flow", ...empty },
        { id: "ratios", label: "Ratios", ...ratios },
      ],
      latestPeriodEnd: "2023-09-30",
    };

    const result = evaluateQualityScorecard(bundle);
    expect(result.methodology).toBe("financial");
    expect(result.items.find((item) => item.id === "cashQuality")?.name).toBe("Beneficio fiable");
    expect(result.items.find((item) => item.id === "cashQuality")?.status).toBe("pass");
    expect(result.items.find((item) => item.id === "balance")?.valueFormatted).toContain("Patrimonio/activo");
  });

  it("no aprueba crecimiento operativo cuando solo crecen los ingresos", () => {
    const income = createDummyStatement(periods, { revenue: [160, 125, 100] });
    const empty = createDummyStatement(periods, {});
    const bundle: StatementBundle = {
      profile: {
        cik: "3", name: "Crecimiento incompleto", tickers: ["INC"], exchanges: ["NYSE"], sector: "Services",
        sic: "7000", sicDescription: "Services", fiscalYearEnd: null, website: null,
        address: null, stateOfIncorporation: null,
      },
      frequency: "annual",
      blocks: [
        { id: "income", label: "Income", ...income },
        { id: "balance", label: "Balance", ...empty },
        { id: "cashflow", label: "Cash Flow", ...empty },
        { id: "ratios", label: "Ratios", ...empty },
      ],
      latestPeriodEnd: "2023-09-30",
    };

    const result = evaluateQualityScorecard(bundle);
    expect(result.items.find((item) => item.id === "growth")?.status).toBe("warn");
    expect(result.score).toBe(0);
    expect(result.maxScore).toBe(6);
  });

  it("no confunde un split con dilución del accionista", () => {
    const income = createDummyStatement(periods, {
      sharesDiluted: [1000, 1000, 1000],
    });
    const shares = income.rows.find((row) => row.line.id === "sharesDiluted")!;
    shares.cells.FY2023.firstReported = { value: 1000, filed: "2023-11-01" };
    shares.cells.FY2022.firstReported = { value: 100, filed: "2022-11-01" };
    shares.cells.FY2021.firstReported = { value: 100, filed: "2021-11-01" };
    const empty = createDummyStatement(periods, {});
    const bundle: StatementBundle = {
      profile: {
        cik: "4", name: "Empresa con split", tickers: ["SPLT"], exchanges: ["NASDAQ"], sector: "Technology",
        sic: "3571", sicDescription: "Technology", fiscalYearEnd: null, website: null,
        address: null, stateOfIncorporation: null,
      },
      frequency: "annual",
      blocks: [
        { id: "income", label: "Income", ...income },
        { id: "balance", label: "Balance", ...empty },
        { id: "cashflow", label: "Cash Flow", ...empty },
        { id: "ratios", label: "Ratios", ...empty },
      ],
      latestPeriodEnd: "2023-09-30",
    };

    const result = evaluateQualityScorecard(bundle, {
      splits: [{ date: "2023-06-01", numerator: 10, denominator: 1 }],
    });
    const discipline = result.items.find((item) => item.id === "perShare");

    expect(discipline?.status).toBe("pass");
    expect(discipline?.valueFormatted).toContain("0.0 %");
  });
});
