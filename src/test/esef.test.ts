import { describe, expect, it } from "vitest";
import { mergeCompanyFacts, xbrlJsonToCompanyFacts } from "@/lib/esef";
import { resolveEsefCompany, type EsefCompany } from "@/lib/esef/companies";
import { normalizeStatement } from "@/lib/sec/normalize";
import { INCOME_STATEMENT } from "@/lib/sec/taxonomy";

const company: EsefCompany = {
  ticker: "TEST.MC",
  name: "Empresa Europea",
  lei: "549300TESTTESTTEST00",
  exchange: "BME",
  country: "España",
  sector: "Industria",
  aliases: ["TEST.MC"],
};

function filing(year: number) {
  return {
    json_url: `/test-${year}.json`,
    report_url: `/test-${year}.xhtml`,
    package_url: null,
    period_end: `${year}-12-31`,
    date_added: `${year + 1}-03-01 09:00:00`,
    country: "ES",
    fxo_id: `test-${year}`,
  };
}

function report(year: number, revenue: number) {
  return xbrlJsonToCompanyFacts({
    facts: {
      revenue: {
        value: revenue,
        dimensions: {
          concept: "ifrs-full:Revenue",
          entity: `lei:${company.lei}`,
          period: `${year}-01-01T00:00:00/${year + 1}-01-01T00:00:00`,
          unit: "iso4217:EUR",
        },
      },
      eps: {
        value: revenue / 10,
        dimensions: {
          concept: "ifrs-full:DilutedEarningsLossPerShare",
          entity: `lei:${company.lei}`,
          period: `${year}-01-01T00:00:00/${year + 1}-01-01T00:00:00`,
          unit: "iso4217:EUR/xbrli:shares",
        },
      },
      segmentRevenue: {
        value: 999_999,
        dimensions: {
          concept: "ifrs-full:Revenue",
          entity: `lei:${company.lei}`,
          period: `${year}-01-01T00:00:00/${year + 1}-01-01T00:00:00`,
          unit: "iso4217:EUR",
          "ifrs-full:SegmentsAxis": "test:EuropeMember",
        },
      },
    },
  }, company, filing(year));
}

describe("normalización ESEF", () => {
  it("resuelve LVMH por ticker y por el nombre Louis Vuitton", () => {
    expect(resolveEsefCompany("MC.PA")).toMatchObject({ lei: "IOG4E947OATN0KJYSD45" });
    expect(resolveEsefCompany("Louis Vuitton")).toMatchObject({ ticker: "MC.PA" });
  });

  it("convierte periodos, unidades y procedencia sin sumar hechos segmentados", () => {
    const facts = report(2024, 120);
    const statement = normalizeStatement(facts, INCOME_STATEMENT, "annual", 10, "EUR");
    const revenue = statement.rows.find((row) => row.line.id === "revenue")!;
    const eps = statement.rows.find((row) => row.line.id === "epsDiluted")!;

    expect(revenue.cells.FY2024.value).toBe(120);
    expect(eps.cells.FY2024.value).toBe(12);
    expect(revenue.cells.FY2024.provenance).toMatchObject({
      kind: "reported",
      unit: "EUR",
      sourceLabel: "informe ESEF",
      sourceUrl: "https://filings.xbrl.org/test-2024.xhtml",
    });
  });

  it("consolida todos los informes para producir el histórico disponible", () => {
    const facts = mergeCompanyFacts(company, [report(2023, 100), report(2024, 120)]);
    const statement = normalizeStatement(facts, INCOME_STATEMENT, "annual", 30, "EUR");
    const revenue = statement.rows.find((row) => row.line.id === "revenue")!;

    expect(statement.periods.map((period) => period.key)).toEqual(["FY2024", "FY2023"]);
    expect(revenue.cells.FY2023.value).toBe(100);
    expect(revenue.cells.FY2024.value).toBe(120);
  });
});
