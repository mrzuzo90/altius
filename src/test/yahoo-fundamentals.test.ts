import { describe, expect, it } from "vitest";
import { yahooTimeseriesToCompanyFacts } from "@/lib/yahoo/fundamentals";
import type { EsefCompany } from "@/lib/esef/companies";
import { normalizeStatement } from "@/lib/sec/normalize";
import { CASH_FLOW, INCOME_STATEMENT } from "@/lib/sec/taxonomy";

const company: EsefCompany = {
  ticker: "TEST.PA",
  name: "Empresa Europea",
  lei: "TESTLEI000000000000",
  exchange: "Euronext Paris",
  country: "Francia",
  sector: "Industria",
  aliases: ["TEST.PA"],
};

function series(type: string, values: Array<{ date: string; raw: number; currency?: string }>) {
  return {
    meta: { symbol: [company.ticker], type: [type] },
    [type]: values.map((value) => ({
      asOfDate: value.date,
      periodType: "12M",
      currencyCode: value.currency ?? "EUR",
      reportedValue: { raw: value.raw },
    })),
  };
}

describe("puente de actualidad anual para emisores europeos", () => {
  it("añade solo ejercicios posteriores a ESEF y conserva su procedencia", () => {
    const converted = yahooTimeseriesToCompanyFacts({
      timeseries: {
        result: [
          series("annualTotalRevenue", [
            { date: "2024-12-31", raw: 90 },
            { date: "2025-12-31", raw: 100 },
          ]),
          series("annualDilutedEPS", [{ date: "2025-12-31", raw: 5 }]),
        ],
      },
    }, company, "2024-12-31", "2026-08-26");

    expect(converted?.latestPeriodEnd).toBe("2025-12-31");
    const statement = normalizeStatement(converted!.facts, INCOME_STATEMENT, "annual", 30, "EUR");
    const revenue = statement.rows.find((row) => row.line.id === "revenue")!;
    const eps = statement.rows.find((row) => row.line.id === "epsDiluted")!;

    expect(statement.periods.map((period) => period.key)).toEqual(["FY2025"]);
    expect(revenue.cells.FY2025.value).toBe(100);
    expect(eps.cells.FY2025.value).toBe(5);
    expect(revenue.cells.FY2025.provenance).toMatchObject({
      kind: "reported",
      form: "YAHOO-ANNUAL",
      filed: "2026-08-26",
      sourceLabel: "Yahoo Finance · último ejercicio",
    });
  });

  it("normaliza salidas de caja para que el FCF no cambie de signo", () => {
    const converted = yahooTimeseriesToCompanyFacts({
      timeseries: {
        result: [
          series("annualOperatingCashFlow", [{ date: "2025-12-31", raw: 100 }]),
          series("annualCapitalExpenditure", [{ date: "2025-12-31", raw: -40 }]),
        ],
      },
    }, company, "2024-12-31", "2026-08-26");
    const statement = normalizeStatement(converted!.facts, CASH_FLOW, "annual", 30, "EUR");
    const capex = statement.rows.find((row) => row.line.id === "capex")!;
    const fcf = statement.rows.find((row) => row.line.id === "freeCashFlow")!;

    expect(capex.cells.FY2025.value).toBe(-40);
    expect(fcf.cells.FY2025.value).toBe(60);
  });

  it("no crea un suplemento cuando el agregador no es más reciente que ESEF", () => {
    const converted = yahooTimeseriesToCompanyFacts({
      timeseries: { result: [series("annualTotalRevenue", [{ date: "2024-12-31", raw: 90 }])] },
    }, company, "2024-12-31", "2026-08-26");

    expect(converted).toBeNull();
  });
});
