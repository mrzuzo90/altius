import { describe, expect, it } from "vitest";
import {
  computeIndexSummary,
  getAllMarketIndices,
  MARKET_INDICES,
  resolveIndexSymbol,
} from "@/lib/indices";
import type { PricePoint } from "@/lib/prices/types";

describe("Módulo de Índices Bursátiles", () => {
  it("resuelve alias de índices correctamente", () => {
    expect(resolveIndexSymbol("SP500")?.symbol).toBe("SP500");
    expect(resolveIndexSymbol("S&P 500")?.symbol).toBe("SP500");
    expect(resolveIndexSymbol("^GSPC")?.symbol).toBe("SP500");
    expect(resolveIndexSymbol("NASDAQ")?.symbol).toBe("NASDAQCOM");
    expect(resolveIndexSymbol("NASDAC")?.symbol).toBe("NASDAQCOM");
    expect(resolveIndexSymbol("DOW")?.symbol).toBe("DJIA");
    expect(resolveIndexSymbol("VIX")?.symbol).toBe("VIXCLS");
    expect(resolveIndexSymbol("NONEXISTENT")).toBeNull();
  });

  it("devuelve los metadatos completos de todos los índices", () => {
    const indices = getAllMarketIndices();
    expect(indices.length).toBe(4);
    const symbols = indices.map((i) => i.symbol);
    expect(symbols).toContain("SP500");
    expect(symbols).toContain("NASDAQCOM");
    expect(symbols).toContain("DJIA");
    expect(symbols).toContain("VIXCLS");
  });

  it("calcula el resumen de variaciones y máximos históricos", () => {
    const points: PricePoint[] = [
      { date: "2025-01-01", close: 5000 },
      { date: "2025-06-01", close: 5400 },
      { date: "2025-12-01", close: 5800 },
      { date: "2026-01-02", close: 5900 },
      { date: "2026-02-01", close: 6000 }, // ATH
      { date: "2026-08-20", close: 5950 },
    ];

    const summary = computeIndexSummary("SP500", points);
    expect(summary.currentValue).toBe(5950);
    expect(summary.ath).toBe(6000);
    expect(summary.athDate).toBe("2026-02-01");
    expect(summary.drawdownFromAthPct).toBeCloseTo(((5950 - 6000) / 6000) * 100, 2);
    expect(summary.high52w).toBe(6000);
    expect(summary.low52w).toBe(5000);
    expect(summary.provider).toBe(MARKET_INDICES.SP500.provider);
  });
});
