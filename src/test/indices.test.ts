import { describe, expect, it } from "vitest";
import {
  computeIndexSummary,
  getAllMarketIndices,
  MARKET_INDICES,
  resolveIndexSymbol,
} from "@/lib/indices";
import type { PricePoint } from "@/lib/prices/types";

describe("Módulo de Índices Bursátiles", () => {
  it("resuelve alias de índices estadounidenses y europeos correctamente", () => {
    // US
    expect(resolveIndexSymbol("SP500")?.symbol).toBe("SP500");
    expect(resolveIndexSymbol("S&P 500")?.symbol).toBe("SP500");
    expect(resolveIndexSymbol("^GSPC")?.symbol).toBe("SP500");
    expect(resolveIndexSymbol("NASDAQ")?.symbol).toBe("NASDAQCOM");
    expect(resolveIndexSymbol("NASDAC")?.symbol).toBe("NASDAQCOM");
    expect(resolveIndexSymbol("DOW")?.symbol).toBe("DJIA");
    expect(resolveIndexSymbol("VIX")?.symbol).toBe("VIXCLS");

    // Europa
    expect(resolveIndexSymbol("EURO STOXX 50")?.symbol).toBe("STOXX50E");
    expect(resolveIndexSymbol("EUROSTOXX50")?.symbol).toBe("STOXX50E");
    expect(resolveIndexSymbol("DAX")?.symbol).toBe("DAX");
    expect(resolveIndexSymbol("DAX 40")?.symbol).toBe("DAX");
    expect(resolveIndexSymbol("IBEX")?.symbol).toBe("IBEX35");
    expect(resolveIndexSymbol("IBEX 35")?.symbol).toBe("IBEX35");
    expect(resolveIndexSymbol("FTSE")?.symbol).toBe("FTSE100");
    expect(resolveIndexSymbol("CAC")?.symbol).toBe("CAC40");
    expect(resolveIndexSymbol("CAC 40")?.symbol).toBe("CAC40");
    expect(resolveIndexSymbol("NONEXISTENT")).toBeNull();
  });

  it("devuelve los metadatos completos y filtra por región", () => {
    const all = getAllMarketIndices();
    expect(all.length).toBe(9);

    const europe = getAllMarketIndices("europe");
    expect(europe.length).toBe(5);
    const eurSymbols = europe.map((i) => i.symbol);
    expect(eurSymbols).toContain("STOXX50E");
    expect(eurSymbols).toContain("DAX");
    expect(eurSymbols).toContain("IBEX35");
    expect(eurSymbols).toContain("FTSE100");
    expect(eurSymbols).toContain("CAC40");

    const us = getAllMarketIndices("us");
    expect(us.length).toBe(4);
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
