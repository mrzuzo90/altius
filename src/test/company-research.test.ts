import { describe, expect, it } from "vitest";
import { buildBusinessSnapshot, buildCompanyAttention } from "@/lib/company-research";
import type { QualityCheckItem, QualityScorecardResult } from "@/lib/sec/quality";
import type { StatementBundle } from "@/lib/sec/statements";

const profile = {
  cik: "1",
  name: "Fabricante tecnológico",
  tickers: ["TECH"],
  exchanges: ["NASDAQ"],
  sic: "3571",
  sicDescription: "Electronic Computers",
  sector: "Manufactura",
  fiscalYearEnd: null,
  website: null,
  address: null,
  stateOfIncorporation: null,
};

const bundle: StatementBundle = {
  profile,
  frequency: "annual",
  currency: "USD",
  latestPeriodEnd: "2025-12-31",
  blocks: [{
    id: "income",
    label: "Resultados",
    periods: [{ key: "FY2025", label: "FY 2025", end: "2025-12-31", fiscalYear: 2025, quarter: 4, derived: false }],
    rows: [
      { line: { id: "revenue", label: "Ingresos", concepts: [], kind: "duration", unit: "USD" }, cells: { FY2025: { value: 400_000_000_000, derived: false, provenance: { kind: "absent" } } } },
      { line: { id: "netIncome", label: "Resultado", concepts: [], kind: "duration", unit: "USD" }, cells: { FY2025: { value: 90_000_000_000, derived: false, provenance: { kind: "absent" } } } },
    ],
  }],
};

function item(id: string, status: QualityCheckItem["status"]): QualityCheckItem {
  return {
    id,
    status,
    category: id,
    name: id,
    valueFormatted: `${id}-valor`,
    description: `${id}-detalle`,
    threshold: "umbral",
    whyItMatters: "importancia",
  };
}

describe("company research", () => {
  it("nombra productos concretos del informe en vez de usar lenguaje corporativo genérico", () => {
    const microsoftProfile = { ...profile, name: "Microsoft Corporation", sicDescription: "Prepackaged Software" };
    const snapshot = buildBusinessSnapshot(
      microsoftProfile,
      { ...bundle, profile: microsoftProfile },
      "Microsoft develops Windows, Azure, Microsoft 365, Teams and Xbox.",
      { label: "10-K", url: "https://example.com/10-k" },
      { reportText: "Our products include Windows, Azure, Microsoft 365, Teams and Xbox. Customers pay for licenses, subscriptions and cloud usage." },
    );

    expect(snapshot.activity).toContain("Windows");
    expect(snapshot.activity).toContain("Azure");
    expect(snapshot.activity).not.toContain("soluciones tecnológicas");
    expect(snapshot.revenueModel).toContain("suscripciones");
    expect(snapshot.profitEngine.status).toBe("not-disclosed");
    expect(snapshot.confidence).toBe("regulatory");
  });

  it("identifica AWS como motor del beneficio de Amazon usando beneficio segmentado", () => {
    const amazonProfile = { ...profile, name: "Amazon.com, Inc.", sicDescription: "Catalog & Mail-Order Houses" };
    const snapshot = buildBusinessSnapshot(
      amazonProfile,
      { ...bundle, profile: amazonProfile },
      "Amazon serves consumers through online stores, Prime and Amazon Web Services.",
      { label: "10-K", url: "https://example.com/amazon-10-k" },
      {
        reportText: "We operate online stores, Prime and AWS. Sellers pay commissions and AWS customers pay for cloud consumption.",
        segmentProfit: {
          name: "AWS",
          profit: 39_800_000_000,
          revenue: 107_500_000_000,
          marginPct: 37.02,
          currency: "USD",
          periodEnd: "2024-12-31",
          metricLabel: "beneficio operativo por segmento",
          comparedSegments: 3,
        },
      },
    );

    expect(snapshot.activity).toContain("AWS");
    expect(snapshot.profitEngine.title).toBe("AWS");
    expect(snapshot.profitEngine.detail).toContain("39,8 mil millones USD");
    expect(snapshot.profitEngine.detail).toContain("37,0 %");
  });

  it("mantiene a un banco diversificado en banca aunque también gestione activos", () => {
    const bankProfile = {
      ...profile,
      name: "Banco global",
      sic: "6021",
      sicDescription: "National Commercial Banks",
      sector: "Finanzas",
    };
    const snapshot = buildBusinessSnapshot(
      bankProfile,
      { ...bundle, profile: bankProfile },
      "The bank provides consumer banking, investment banking and asset management services.",
    );

    expect(snapshot.activity).toContain("Intermedia ahorro y crédito");
    expect(snapshot.revenueModel).toContain("margen entre intereses");
  });

  it("devuelve exactamente tres señales y prioriza riesgos sin ocultar fortalezas", () => {
    const scorecard: QualityScorecardResult = {
      score: 3,
      maxScore: 6,
      coverage: 6,
      methodology: "operating",
      methodologyLabel: "Metodología operativa",
      items: [
        item("growth", "pass"),
        item("returns", "pass"),
        item("cashQuality", "warn"),
        item("balance", "fail"),
        item("perShare", "pass"),
        item("valuation", "fail"),
      ],
    };

    const attention = buildCompanyAttention(scorecard);
    expect(attention).toHaveLength(3);
    expect(attention.filter((signal) => signal.tone === "risk")).toHaveLength(2);
    expect(attention.some((signal) => signal.tone === "positive")).toBe(true);
  });
});
