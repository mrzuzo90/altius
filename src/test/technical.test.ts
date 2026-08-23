import { describe, expect, it } from "vitest";
import {
  buildTechnicalDataset,
  calculateAnnualizedVolatility,
  calculateBollingerBands,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateSMA,
  calculateSupportResistance,
} from "@/lib/technical";
import type { PricePoint } from "@/lib/prices/types";

describe("Cálculo de Indicadores Técnicos", () => {
  it("calcula la SMA correctamente con relleno null para periodos incompletos", () => {
    const data = [10, 20, 30, 40, 50];
    const sma3 = calculateSMA(data, 3);

    expect(sma3).toEqual([null, null, 20, 30, 40]);
  });

  it("calcula la EMA respetando el factor de suavizado k", () => {
    const data = [10, 11, 12, 13, 14, 15];
    const ema3 = calculateEMA(data, 3);

    expect(ema3[0]).toBeNull();
    expect(ema3[1]).toBeNull();
    // Primera EMA es el promedio de los primeros 3: (10+11+12)/3 = 11
    expect(ema3[2]).toBeCloseTo(11, 2);
    // k = 2 / (3 + 1) = 0.5. ema[3] = 13 * 0.5 + 11 * 0.5 = 12
    expect(ema3[3]).toBeCloseTo(12, 2);
  });

  it("calcula Bandas de Bollinger con ancho y percentil B", () => {
    const data = Array.from({ length: 25 }, (_, i) => 100 + (i % 5) * 2);
    const bb = calculateBollingerBands(data, 20, 2);

    expect(bb.middle[18]).toBeNull();
    expect(bb.middle[19]).toBeTypeOf("number");
    expect(bb.upper[19]).toBeGreaterThan(bb.middle[19]!);
    expect(bb.lower[19]).toBeLessThan(bb.middle[19]!);
    expect(bb.percentB[19]).toBeTypeOf("number");
    expect(bb.bandwidth[19]).toBeTypeOf("number");
  });

  it("calcula el RSI con el método de Wilder", () => {
    // Serie estrictamente creciente -> RSI debe ser 100
    const rising = Array.from({ length: 20 }, (_, i) => 100 + i * 5);
    const rsiRising = calculateRSI(rising, 14);
    expect(rsiRising[14]).toBe(100);

    // Serie oscilante
    const mixed = [
      100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 111, 110, 112, 114, 113,
      115, 114, 116, 118, 117,
    ];
    const rsiMixed = calculateRSI(mixed, 14);
    expect(rsiMixed[14]).toBeGreaterThan(50);
    expect(rsiMixed[14]).toBeLessThan(100);
  });

  it("calcula el MACD (Línea, Señal e Histograma)", () => {
    const data = Array.from({ length: 40 }, (_, i) => 50 + Math.sin(i / 3) * 10);
    const macd = calculateMACD(data, 12, 26, 9);

    expect(macd.macdLine[24]).toBeNull();
    expect(macd.macdLine[25]).toBeTypeOf("number");
    // Histograma = Línea - Señal
    const lastIdx = data.length - 1;
    if (macd.macdLine[lastIdx] !== null && macd.signalLine[lastIdx] !== null) {
      expect(macd.histogram[lastIdx]).toBeCloseTo(
        macd.macdLine[lastIdx]! - macd.signalLine[lastIdx]!,
        4,
      );
    }
  });

  it("calcula soportes y resistencias basados en pivotes locales", () => {
    const points: PricePoint[] = [
      { date: "2026-01-01", close: 100 },
      { date: "2026-01-02", close: 110 },
      { date: "2026-01-03", close: 120 }, // Pivote High
      { date: "2026-01-04", close: 110 },
      { date: "2026-01-05", close: 90 }, // Pivote Low
      { date: "2026-01-06", close: 105 },
      { date: "2026-01-07", close: 108 },
    ];

    const { supports, resistances } = calculateSupportResistance(points);
    expect(supports.length + resistances.length).toBeGreaterThanOrEqual(1);
  });

  it("calcula la volatilidad anualizada", () => {
    const points: PricePoint[] = [
      { date: "2026-01-01", close: 100 },
      { date: "2026-01-08", close: 102 },
      { date: "2026-01-15", close: 99 },
      { date: "2026-01-22", close: 104 },
      { date: "2026-01-29", close: 103 },
    ];
    const vol = calculateAnnualizedVolatility(points, 52);
    expect(vol).toBeGreaterThan(0);
    expect(Number.isFinite(vol)).toBe(true);
  });

  it("genera diagnósticos cualitativos coherentes", () => {
    const points: PricePoint[] = Array.from({ length: 210 }, (_, i) => ({
      date: `2025-${String(Math.floor(i / 30) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
      close: 100 + i * 0.5, // Fuerte tendencia alcista
    }));

    const dataset = buildTechnicalDataset("TEST", "Mock Source", points);
    expect(["bullish", "strong_bullish"]).toContain(dataset.stats.overallBias);
    expect(dataset.stats.signals.length).toBeGreaterThan(0);
    expect(dataset.stats.summaryText).toContain("alcista");
  });
});
