import { describe, expect, it } from "vitest";
import {
  chartSpanDays,
  chartTimeTicks,
  formatPriceChartTick,
  formatPriceQuote,
  priceChartDomain,
  timestampPricePoints,
} from "@/lib/prices/chart";

describe("utilidades de gráficos de precios", () => {
  it("convierte la fecha en una escala temporal real", () => {
    const points = timestampPricePoints([
      { date: "2026-01-01", close: 10 },
      { date: "2026-01-11", close: 11 },
      { date: "2026-04-11", close: 12 },
    ]);
    expect(points[1].timestamp - points[0].timestamp).toBe(10 * 86_400_000);
    expect(points[2].timestamp - points[1].timestamp).toBe(90 * 86_400_000);
    expect(chartSpanDays(points)).toBe(100);
  });

  it("muestra días en periodos cortos y años en periodos largos", () => {
    const timestamp = Date.UTC(2026, 7, 26);
    expect(formatPriceChartTick(timestamp, 30)).toMatch(/26/);
    expect(formatPriceChartTick(timestamp, 4_000)).toBe("2026");
  });

  it("genera un número estable de marcas repartidas por tiempo", () => {
    const points = timestampPricePoints([
      { date: "2021-08-26" },
      { date: "2026-08-26" },
    ]);
    const ticks = chartTimeTicks(points);
    expect(ticks).toHaveLength(6);
    expect(ticks[0]).toBe(points[0].timestamp);
    expect(ticks.at(-1)).toBe(points.at(-1)!.timestamp);
  });

  it("conserva decimales útiles para acciones de precio pequeño", () => {
    expect(formatPriceQuote(0.125, "USD", true)).toContain("0,125");
    expect(formatPriceQuote(313.2791, "USD")).toContain("313,28");
  });

  it("añade aire vertical sin forzar el eje a cero", () => {
    const [minimum, maximum] = priceChartDomain([
      { date: "2026-01-01", close: 100 },
      { date: "2026-01-02", close: 110 },
    ]);
    expect(minimum).toBeGreaterThan(0);
    expect(minimum).toBeLessThan(100);
    expect(maximum).toBeGreaterThan(110);
  });
});
