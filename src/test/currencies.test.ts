import { describe, expect, it } from "vitest";
import {
  computeCurrencySummary,
  CURRENCY_PAIRS,
  getAllCurrencyPairs,
  resolveCurrencySymbol,
} from "@/lib/currencies";
import type { PricePoint } from "@/lib/prices/types";

describe("Módulo de Divisas y Tipos de Cambio (Forex)", () => {
  it("resuelve alias de divisas correctamente", () => {
    expect(resolveCurrencySymbol("EUR/USD")?.symbol).toBe("EURUSD");
    expect(resolveCurrencySymbol("EURUSD")?.symbol).toBe("EURUSD");
    expect(resolveCurrencySymbol("EURO")?.symbol).toBe("EURUSD");
    expect(resolveCurrencySymbol("GBP/USD")?.symbol).toBe("GBPUSD");
    expect(resolveCurrencySymbol("LIBRA")?.symbol).toBe("GBPUSD");
    expect(resolveCurrencySymbol("USD/JPY")?.symbol).toBe("USDJPY");
    expect(resolveCurrencySymbol("YEN")?.symbol).toBe("USDJPY");
    expect(resolveCurrencySymbol("USD/CHF")?.symbol).toBe("USDCHF");
    expect(resolveCurrencySymbol("USD/CAD")?.symbol).toBe("USDCAD");
    expect(resolveCurrencySymbol("USD/CNY")?.symbol).toBe("USDCNY");
    expect(resolveCurrencySymbol("USD/MXN")?.symbol).toBe("USDMXN");
    expect(resolveCurrencySymbol("DXY")?.symbol).toBe("DXY");
    expect(resolveCurrencySymbol("DOLAR")?.symbol).toBe("DXY");
    expect(resolveCurrencySymbol("NOEXISTE")).toBeNull();
  });

  it("devuelve la lista completa de pares oficiales", () => {
    const all = getAllCurrencyPairs();
    expect(all.length).toBe(8);
    const symbols = all.map((c) => c.symbol);
    expect(symbols).toContain("EURUSD");
    expect(symbols).toContain("GBPUSD");
    expect(symbols).toContain("USDJPY");
    expect(symbols).toContain("USDCHF");
    expect(symbols).toContain("DXY");
  });

  it("calcula el resumen de tipo de cambio, variaciones y drawdown", () => {
    const points: PricePoint[] = [
      { date: "2025-01-01", close: 1.05 },
      { date: "2025-06-01", close: 1.08 },
      { date: "2025-12-01", close: 1.10 },
      { date: "2026-01-02", close: 1.12 },
      { date: "2026-04-01", close: 1.15 }, // ATH
      { date: "2026-08-20", close: 1.11 },
    ];

    const summary = computeCurrencySummary("EURUSD", points);
    expect(summary.currentValue).toBe(1.11);
    expect(summary.ath).toBe(1.15);
    expect(summary.athDate).toBe("2026-04-01");
    expect(summary.drawdownFromAthPct).toBeCloseTo(((1.11 - 1.15) / 1.15) * 100, 2);
    expect(summary.high52w).toBe(1.15);
    expect(summary.low52w).toBe(1.05);
    expect(summary.provider).toBe(CURRENCY_PAIRS.EURUSD.provider);
  });
});
