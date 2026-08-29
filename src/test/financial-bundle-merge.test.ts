import { describe, expect, it } from "vitest";
import { mergeStatementBundles } from "@/lib/financials/merge";
import type { StatementBlock, StatementBundle } from "@/lib/sec/statements";
import type { StatementId } from "@/lib/sec/taxonomy";

const profile = {
  cik: "",
  name: "Europea",
  tickers: ["EUR.MC"],
  exchanges: ["BME"],
  sic: "",
  sicDescription: "",
  sector: "",
  fiscalYearEnd: null,
  website: null,
  address: null,
  stateOfIncorporation: null,
};

function block(id: StatementId, current: number | null, old: number | null): StatementBlock {
  const lineId = id === "income" ? "revenue" : id === "balance" ? "totalAssets" : "operatingCashFlow";
  return {
    id,
    label: id,
    periods: [
      { key: "FY2024", label: "FY 2024", end: "2024-12-31", fiscalYear: 2024, quarter: 4, derived: false },
      { key: "FY2023", label: "FY 2023", end: "2023-12-31", fiscalYear: 2023, quarter: 4, derived: false },
    ],
    rows: [{
      line: { id: lineId, label: lineId, concepts: [], unit: "USD", kind: id === "balance" ? "instant" : "duration" },
      cells: {
        FY2024: { value: current, derived: false, provenance: { kind: "absent" } },
        FY2023: { value: old, derived: false, provenance: { kind: "absent" } },
      },
    }],
  };
}

function bundle(source: string, current: number | null, old: number | null, currency = "EUR"): StatementBundle {
  return {
    profile,
    frequency: "annual",
    currency,
    latestPeriodEnd: "2024-12-31",
    source: { label: source, detail: source },
    blocks: [block("income", current, old), block("balance", current, old), block("cashflow", current, old)],
  };
}

describe("consolidación de proveedores regulatorios", () => {
  it("prioriza ESEF y usa SEC únicamente cuando falta una celda", () => {
    const merged = mergeStatementBundles(bundle("ESEF", 120, null), bundle("SEC 20-F", 999, 100));
    const revenue = merged.blocks.find((item) => item.id === "income")!.rows[0];

    expect(revenue.cells.FY2024.value).toBe(120);
    expect(revenue.cells.FY2023.value).toBe(100);
    expect(merged.source?.label).toBe("ESEF + SEC 20-F");
  });

  it("rechaza el backfill cuando las divisas no coinciden", () => {
    const primary = bundle("ESEF", 120, null, "EUR");
    const merged = mergeStatementBundles(primary, bundle("SEC 20-F", 999, 100, "USD"));

    expect(merged).toBe(primary);
  });
});
