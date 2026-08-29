import { describe, expect, it } from "vitest";
import { buildHistoricalPeSeries, median } from "@/lib/valuation/historical-pe";
import type { StatementBundle } from "@/lib/sec/statements";

const provenance = (filed: string) => ({
  kind: "reported" as const,
  concept: "EarningsPerShareDiluted",
  unit: "USD/shares",
  periodStart: "2023-01-01",
  periodEnd: "2023-12-31",
  form: "10-K",
  filed,
  accn: "1",
});

const bundle: StatementBundle = {
  profile: { cik: "1", name: "Test", tickers: ["TST"], exchanges: ["NYSE"], sic: "", sicDescription: "", sector: "", fiscalYearEnd: null, website: null, address: null, stateOfIncorporation: null },
  frequency: "annual",
  latestPeriodEnd: "2024-12-31",
  blocks: [{
    id: "income",
    label: "Cuenta de resultados",
    periods: [
      { key: "FY2024", label: "FY 2024", end: "2024-12-31", fiscalYear: 2024, quarter: 4, derived: false },
      { key: "FY2023", label: "FY 2023", end: "2023-12-31", fiscalYear: 2023, quarter: 4, derived: false },
    ],
    rows: [{
      line: { id: "epsDiluted", label: "BPA diluido", concepts: [], unit: "USD/shares", kind: "duration" },
      cells: {
        FY2024: { value: 4, derived: false, provenance: provenance("2025-02-10") },
        FY2023: { value: 2, derived: false, provenance: provenance("2024-02-10") },
      },
    }],
  }],
};

describe("PER histórico", () => {
  it("usa el último precio conocido antes de la publicación y calcula la prima frente a la mediana", () => {
    const series = buildHistoricalPeSeries(bundle, {
      ticker: "TST",
      currency: "USD",
      source: "test",
      points: [
        { date: "2024-02-09", close: 20 },
        { date: "2025-02-07", close: 60 },
        { date: "2025-08-01", close: 80 },
      ],
    });
    expect(series.points.map((point) => point.pe)).toEqual([10, 15]);
    expect(series.currentPe).toBe(20);
    expect(series.median10Y).toBe(12.5);
    expect(series.median20Y).toBeNull();
    expect(series.premiumToMedian10Y).toBeCloseTo(60);
    expect(series.premiumToMedian20Y).toBeNull();
    expect(series.observations20Y).toBe(2);
  });

  it("calcula la mediana PER sobre una ventana temporal real de 20 ejercicios", () => {
    const periods = Array.from({ length: 21 }, (_, index) => {
      const fiscalYear = 2024 - index;
      return {
        key: `FY${fiscalYear}`,
        label: `FY ${fiscalYear}`,
        end: `${fiscalYear}-12-31`,
        fiscalYear,
        quarter: 4,
        derived: false,
      };
    });
    const cells = Object.fromEntries(periods.map((period) => [
      period.key,
      {
        value: 2,
        derived: false,
        provenance: provenance(`${period.fiscalYear + 1}-02-10`),
      },
    ]));
    const longBundle: StatementBundle = {
      ...bundle,
      latestPeriodEnd: "2024-12-31",
      blocks: [{
        ...bundle.blocks[0],
        periods,
        rows: [{ ...bundle.blocks[0].rows[0], cells }],
      }],
    };
    const prices = Array.from({ length: 21 }, (_, index) => {
      const fiscalYear = 2004 + index;
      const pe = fiscalYear === 2004 ? 100 : fiscalYear <= 2014 ? 10 : 30;
      return { date: `${fiscalYear + 1}-02-09`, close: pe * 2 };
    });

    const series = buildHistoricalPeSeries(longBundle, {
      ticker: "TST",
      currency: "USD",
      source: "test",
      points: prices,
    });

    expect(series.median20Y).toBe(20);
    expect(series.medianAll).toBe(30);
    expect(series.observations20Y).toBe(20);
    expect(series.startFiscalYear20Y).toBe(2005);
    expect(series.endFiscalYear20Y).toBe(2024);
  });

  it("no mezcla una cotización y un BPA de divisas distintas", () => {
    const series = buildHistoricalPeSeries(bundle, { ticker: "TST", currency: "EUR", source: "test", points: [{ date: "2025-08-01", close: 80 }] });
    expect(series.comparableCurrency).toBe(false);
    expect(series.currentPe).toBeNull();
  });

  it("usa el BPA básico cuando el emisor IFRS no publica BPA diluido", () => {
    const basicOnly: StatementBundle = {
      ...bundle,
      blocks: [{
        ...bundle.blocks[0],
        rows: [{
          line: { id: "epsBasic", label: "BPA básico", concepts: [], unit: "USD/shares", kind: "duration" },
          cells: {
            FY2024: { value: 4, derived: false, provenance: provenance("2025-02-10") },
            FY2023: { value: 2, derived: false, provenance: provenance("2024-02-10") },
          },
        }],
      }],
    };
    const series = buildHistoricalPeSeries(basicOnly, {
      ticker: "TST",
      currency: "USD",
      source: "test",
      points: [
        { date: "2024-02-09", close: 20 },
        { date: "2025-02-07", close: 60 },
        { date: "2025-08-01", close: 80 },
      ],
    });

    expect(series.points.map((point) => point.pe)).toEqual([10, 15]);
    expect(series.currentPe).toBe(20);
  });

  it("compara precio y BPA en la misma base después de un split", () => {
    const splitBundle: StatementBundle = {
      ...bundle,
      blocks: [{
        ...bundle.blocks[0],
        periods: [bundle.blocks[0].periods[1]],
        rows: [{
          ...bundle.blocks[0].rows[0],
          cells: {
            FY2023: {
              value: 20,
              derived: false,
              provenance: provenance("2024-02-10"),
              firstReported: { value: 20, filed: "2024-02-10" },
            },
          },
        }],
      }],
    };
    const series = buildHistoricalPeSeries(splitBundle, {
      ticker: "TST",
      currency: "USD",
      source: "test",
      points: [{ date: "2024-02-09", close: 25 }],
      splits: [{ date: "2024-06-01", numerator: 4, denominator: 1 }],
    });

    expect(series.points[0].eps).toBe(5);
    expect(series.points[0].pe).toBe(5);
  });

  it("usa la primera presentación para el histórico y la reexpresión para el PER actual", () => {
    const pointInTimeBundle: StatementBundle = {
      ...bundle,
      blocks: [{
        ...bundle.blocks[0],
        periods: [bundle.blocks[0].periods[0]],
        rows: [{
          ...bundle.blocks[0].rows[0],
          cells: {
            FY2024: {
              value: 4,
              derived: false,
              provenance: provenance("2026-02-10"),
              firstReported: { value: 2, filed: "2025-02-10" },
            },
          },
        }],
      }],
    };
    const series = buildHistoricalPeSeries(pointInTimeBundle, {
      ticker: "TST",
      currency: "USD",
      source: "test",
      points: [
        { date: "2025-02-07", close: 20 },
        { date: "2026-02-09", close: 60 },
      ],
    });

    expect(series.points[0].earningsKnownAt).toBe("2025-02-10");
    expect(series.points[0].pe).toBe(10);
    expect(series.latestEps).toBe(4);
    expect(series.currentPe).toBe(15);
  });

  it("calcula la mediana sin dejarse arrastrar por un extremo", () => {
    expect(median([10, 12, 100])).toBe(12);
    expect(median([10, 12])).toBe(11);
  });
});
