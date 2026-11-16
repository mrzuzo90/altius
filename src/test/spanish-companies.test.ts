import { describe, expect, it } from "vitest";
import { resolveEsefCompany } from "@/lib/esef/companies";
import { resolveEsefCompanyDynamic } from "@/lib/esef/resolve";
import { buildEsefStatements } from "@/lib/esef";
import { mergeStatementBundles } from "@/lib/financials/merge";
import { applySplitsToStatementBundle } from "@/lib/financials/splits";
import { supplementAnnualStatements } from "@/lib/financials/yahoo-supplement";
import { getPriceSeries } from "@/lib/prices";
import { evaluateQualityScorecard } from "@/lib/sec/quality";
import type { StatementBundle } from "@/lib/sec/statements";
import { CASH_FLOW, INCOME_STATEMENT, BALANCE_SHEET, RATIOS_STATEMENT } from "@/lib/sec/taxonomy";
import { buildHistoricalPeSeries } from "@/lib/valuation/historical-pe";

function rowVal(bundle: StatementBundle, blockId: string, lineId: string, periodKey: string): number | null {
  return (
    bundle.blocks
      .find((b) => b.id === blockId)
      ?.rows.find((r) => r.line.id === lineId)
      ?.cells[periodKey]?.value ?? null
  );
}

describe("empresas españolas (Bolsa de Madrid / BME)", () => {
  it("resuelve Iberdrola, Inditex, Telefónica, Indra y Aena por nombre, alias y ticker", () => {
    expect(resolveEsefCompany("IBE.MC")?.lei).toBe("5QK37QC7NWOJ8D7WVQ45");
    expect(resolveEsefCompany("Iberdrola")?.ticker).toBe("IBE.MC");
    expect(resolveEsefCompany("ITX.MC")?.lei).toBe("549300TTCXZOGZM2EY83");
    expect(resolveEsefCompany("Inditex")?.ticker).toBe("ITX.MC");
    expect(resolveEsefCompany("Telefónica")?.ticker).toBe("TEF.MC");
    expect(resolveEsefCompany("TELEFONICA")?.lei).toBe("549300EEJH4FEPDBBR25");
    expect(resolveEsefCompany("BME: TEF")?.ticker).toBe("TEF.MC");
    expect(resolveEsefCompany("Indra")?.ticker).toBe("IDR.MC");
    expect(resolveEsefCompany("IDR")?.lei).toBe("95980020140005308793");
    expect(resolveEsefCompany("Aena")?.ticker).toBe("AENA.MC");
    expect(resolveEsefCompany("BME:AENA")?.lei).toBe("959800R7QMXKF0NFMT29");
  });

  it("calcula el flujo de caja libre cuando CFO viene de ESEF y CapEx del suplemento Yahoo", () => {
    const periods = [{ key: "FY2025", label: "FY 2025", end: "2025-12-31", fiscalYear: 2025, quarter: 4, derived: false }];
    const absent = { kind: "absent" as const };
    const makeCell = (value: number | null, form: string) =>
      value === null
        ? { value: null, derived: false, provenance: absent }
        : {
            value,
            derived: false,
            provenance: {
              kind: "reported" as const,
              concept: "Test",
              unit: "EUR",
              periodStart: "2025-01-01",
              periodEnd: "2025-12-31",
              form,
              filed: "2026-03-01",
              accn: "TEST",
            },
          };

    const primary: StatementBundle = {
      profile: {
        cik: "", lei: "TEST", name: "Telefónica Test", tickers: ["TEF.MC"], exchanges: ["BME"],
        sic: "", sicDescription: "Telecom", sector: "Telecomunicaciones", fiscalYearEnd: null, website: null, address: null, stateOfIncorporation: "España",
      },
      frequency: "annual",
      currency: "EUR",
      latestPeriodEnd: "2025-12-31",
      blocks: [
        {
          id: "income",
          label: "Income",
          periods,
          rows: INCOME_STATEMENT.map((line) => ({
            line,
            cells: { FY2025: makeCell(line.id === "revenue" ? 35_120e6 : null, "ESEF") },
          })),
        },
        {
          id: "balance",
          label: "Balance",
          periods,
          rows: BALANCE_SHEET.map((line) => ({
            line,
            cells: { FY2025: makeCell(null, "ESEF") },
          })),
        },
        {
          id: "cashflow",
          label: "Cash Flow",
          periods,
          rows: CASH_FLOW.map((line) => ({
            line,
            cells: { FY2025: makeCell(line.id === "operatingCashFlow" ? 9_722e6 : null, "ESEF") },
          })),
        },
        {
          id: "ratios",
          label: "Ratios",
          periods,
          rows: RATIOS_STATEMENT.map((line) => ({ line, cells: { FY2025: { value: null, derived: false, provenance: absent } } })),
        },
      ],
    };

    const backfill: StatementBundle = {
      ...primary,
      blocks: primary.blocks.map((block) =>
        block.id !== "cashflow"
          ? block
          : {
              ...block,
              rows: block.rows.map((row) =>
                row.line.id === "capex"
                  ? { ...row, cells: { FY2025: makeCell(-5_055e6, "YAHOO-ANNUAL") } }
                  : row,
              ),
            },
      ),
    };

    const merged = mergeStatementBundles(primary, backfill);
    expect(rowVal(merged, "cashflow", "freeCashFlow", "FY2025")).toBe(4_667e6);
  });

  it("normaliza splits tanto en comparativos sin reexpresar como sin dividir dos veces Yahoo", () => {
    const periods = [
      { key: "FY2025", label: "FY 2025", end: "2025-12-31", fiscalYear: 2025, quarter: 4, derived: false },
      { key: "FY2024", label: "FY 2024", end: "2024-12-31", fiscalYear: 2024, quarter: 4, derived: false },
    ];
    const absent = { kind: "absent" as const };
    const reportedCell = (value: number, periodEnd: string, form: string, filed: string) => ({
      value,
      derived: false,
      provenance: {
        kind: "reported" as const,
        concept: "Test",
        unit: form === "YAHOO-ANNUAL" ? "shares" : "EUR/shares",
        periodStart: `${periodEnd.slice(0, 4)}-01-01`,
        periodEnd,
        form,
        filed,
        accn: "TEST",
      },
      firstReported: { value, filed: form === "ESEF" ? `${Number(periodEnd.slice(0, 4)) + 1}-03-01` : filed },
    });

    const bundle: StatementBundle = {
      profile: {
        cik: "", lei: "TEST", name: "Aena Test", tickers: ["AENA.MC"], exchanges: ["BME"],
        sic: "", sicDescription: "Airports", sector: "Industriales", fiscalYearEnd: null, website: null, address: null, stateOfIncorporation: "España",
      },
      frequency: "annual",
      currency: "EUR",
      latestPeriodEnd: "2025-12-31",
      blocks: [
        {
          id: "income",
          label: "Income",
          periods,
          rows: INCOME_STATEMENT.map((line) => {
            if (line.id === "netIncome") {
              return {
                line,
                cells: {
                  FY2025: reportedCell(2_136.7e6, "2025-12-31", "ESEF", "2026-03-20"),
                  FY2024: reportedCell(1_934.2e6, "2024-12-31", "ESEF", "2026-03-20"),
                },
              };
            }
            if (line.id === "epsDiluted" || line.id === "epsBasic") {
              return {
                line,
                cells: {
                  FY2025: reportedCell(1.42, "2025-12-31", "ESEF", "2026-03-20"),
                  // Comparativo 2024 sin reexpresar dentro del informe 2025 (filed > splitDate)
                  FY2024: reportedCell(12.89, "2024-12-31", "ESEF", "2026-03-20"),
                },
              };
            }
            if (line.id === "sharesDiluted") {
              return {
                line,
                cells: {
                  FY2025: reportedCell(1_500e6, "2025-12-31", "YAHOO-ANNUAL", "2026-11-16"),
                  FY2024: reportedCell(1_500e6, "2024-12-31", "YAHOO-ANNUAL", "2026-11-16"),
                },
              };
            }
            return {
              line,
              cells: {
                FY2025: { value: null, derived: false, provenance: absent },
                FY2024: { value: null, derived: false, provenance: absent },
              },
            };
          }),
        },
        {
          id: "balance",
          label: "Balance",
          periods,
          rows: BALANCE_SHEET.map((line) => ({
            line,
            cells: {
              FY2025: { value: null, derived: false, provenance: absent },
              FY2024: { value: null, derived: false, provenance: absent },
            },
          })),
        },
        {
          id: "cashflow",
          label: "Cash Flow",
          periods,
          rows: CASH_FLOW.map((line) => ({
            line,
            cells: {
              FY2025: { value: null, derived: false, provenance: absent },
              FY2024: { value: null, derived: false, provenance: absent },
            },
          })),
        },
        {
          id: "ratios",
          label: "Ratios",
          periods,
          rows: RATIOS_STATEMENT.map((line) => ({
            line,
            cells: {
              FY2025: { value: null, derived: false, provenance: absent },
              FY2024: { value: null, derived: false, provenance: absent },
            },
          })),
        },
      ],
    };

    const normalized = applySplitsToStatementBundle(bundle, [
      { date: "2025-06-19", numerator: 10, denominator: 1 },
    ]);

    expect(rowVal(normalized, "income", "epsDiluted", "FY2024")).toBeCloseTo(1.289, 3);
    expect(rowVal(normalized, "income", "sharesDiluted", "FY2024")).toBe(1_500e6);
    expect(rowVal(normalized, "ratios", "epsGrowthYoY", "FY2025")).toBeCloseTo(((1.42 / 1.289) - 1) * 100, 1);

    const pe = buildHistoricalPeSeries(
      normalized,
      {
        ticker: "AENA.MC",
        currency: "EUR",
        source: "test",
        points: [
          { date: "2025-02-28", close: 22.0 },
          { date: "2026-11-16", close: 29.22 },
        ],
        splits: [{ date: "2025-06-19", numerator: 10, denominator: 1 }],
      },
      "EUR",
    );
    expect(pe.points.find((p) => p.fiscalYear === 2024)?.eps).toBeCloseTo(1.289, 3);
    expect(pe.latestEps).toBeCloseTo(1.42, 2);
  });

  it("valida 10 años completos, métricas clave y cobertura 6/6 en las 5 empresas españolas", async () => {
    const tickers = ["IBE.MC", "ITX.MC", "TEF.MC", "IDR.MC", "AENA.MC"] as const;

    for (const ticker of tickers) {
      const esef = await resolveEsefCompanyDynamic(ticker);
      expect(esef, `${ticker} debe resolver en ESEF`).not.toBeNull();

      const [base, prices] = await Promise.all([
        buildEsefStatements(esef!, "annual"),
        getPriceSeries(ticker),
      ]);
      const supplemented = await supplementAnnualStatements(base, {
        ticker: esef!.ticker,
        name: esef!.name,
        country: esef!.country,
        sector: esef!.sector,
      });
      const finalBundle = prices.ok && prices.series.splits?.length
        ? applySplitsToStatementBundle(supplemented, prices.series.splits)
        : supplemented;

      const income = finalBundle.blocks.find((b) => b.id === "income")!;
      expect(income.periods.length, `${ticker} debe cubrir 10 años`).toBeGreaterThanOrEqual(10);

      const pe = buildHistoricalPeSeries(finalBundle, prices.ok ? prices.series : null, "EUR");
      const scorecard = evaluateQualityScorecard(finalBundle, {
        historicalPe: pe,
        splits: prices.ok ? prices.series.splits : undefined,
      });
      expect(scorecard.coverage, `${ticker} debe tener cobertura 6/6 en Las seis claves`).toBe(6);

      if (ticker === "ITX.MC") {
        expect(rowVal(finalBundle, "balance", "cashAndShortTermInvestments", "FY2026")).toBe(10_960e6);
      }
      if (ticker === "TEF.MC") {
        expect(rowVal(finalBundle, "cashflow", "freeCashFlow", "FY2025")).toBe(4_667e6);
        expect(rowVal(finalBundle, "cashflow", "freeCashFlow", "FY2024")).toBe(6_143e6);
      }
      if (ticker === "IDR.MC") {
        expect(rowVal(finalBundle, "cashflow", "capex", "FY2025")).toBeCloseTo(-137.8e6, -5);
      }
      if (ticker === "AENA.MC") {
        expect(rowVal(finalBundle, "income", "epsDiluted", "FY2024")).toBeCloseTo(1.289, 2);
        expect(rowVal(finalBundle, "income", "epsDiluted", "FY2025")).toBeCloseTo(1.42, 2);
        expect(rowVal(finalBundle, "ratios", "epsGrowthYoY", "FY2025")).toBeGreaterThan(5);
        expect(scorecard.items.find((i) => i.id === "perShare")?.valueFormatted).toContain("0.0 %");
      }
      if (ticker === "IBE.MC") {
        expect(rowVal(finalBundle, "ratios", "roic", "FY2025")).toBeGreaterThan(0);
        expect(rowVal(finalBundle, "balance", "totalDebt", "FY2025")).toBe(54_090e6);
      }
    }
  }, 60000);
});
