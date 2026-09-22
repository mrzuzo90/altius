import { describe, expect, it } from "vitest";
import {
  chartSpanDays,
  chartTimeTicks,
  formatPriceChartTick,
  formatPriceQuote,
  priceChartDomain,
  timestampPricePoints,
} from "@/lib/prices/chart";
import {
  calculatePriceAnnualTrend,
  calculateTenYearAnnualTrend,
} from "@/components/price-chart";
import { buildPriceMotionPlan, buildThreeMonthTrendPoints } from "@/components/price-trend-animation";

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

  describe("rendimiento anual a 10 años con Cid", () => {
    it("devuelve null si hay menos de dos puntos", () => {
      expect(calculateTenYearAnnualTrend([])).toBeNull();
      expect(calculateTenYearAnnualTrend([{ date: "2016-01-01", close: 100 }])).toBeNull();
    });

    it("asigna Cid cañon a una subida explosiva mayor al 30 % anualizado", () => {
      // 100 a 1400 en 10 años -> ~30.2% anualizado
      const trend = calculateTenYearAnnualTrend([
        { date: "2016-01-01", close: 100 },
        { date: "2026-01-01", close: 1400 },
      ]);
      expect(trend).not.toBeNull();
      expect(trend!.phase).toBe("canon");
      expect(trend!.mascot.src).toBe("/cid/canon.svg");
      expect(trend!.patternName).toBe("Cid cañon");
      expect(trend!.patternDescription).toBe("Subida explosiva (+30%)");
      expect(trend!.rate).toBeGreaterThan(30);
    });

    it("asigna Cid cuerda a un crecimiento fuerte (+15 % a +30 % anualizado)", () => {
      // 100 a 600 en 10 años -> ~19.6% anualizado
      const trend = calculateTenYearAnnualTrend([
        { date: "2016-01-01", close: 100 },
        { date: "2026-01-01", close: 600 },
      ]);
      expect(trend).not.toBeNull();
      expect(trend!.phase).toBe("cuerda");
      expect(trend!.mascot.src).toBe("/cid/cuerda.svg");
      expect(trend!.patternName).toBe("Cid cuerda");
      expect(trend!.patternDescription).toBe("Crecimiento fuerte (+15% a +30%)");
      expect(trend!.rate).toBeGreaterThan(15);
      expect(trend!.rate).toBeLessThanOrEqual(30);
    });

    it("asigna Cid caballero a un crecimiento moderado (+5 % a +15 % anualizado)", () => {
      // 100 a 250 en 10 años -> ~9.6% anualizado
      const trend = calculateTenYearAnnualTrend([
        { date: "2016-01-01", close: 100 },
        { date: "2026-01-01", close: 250 },
      ]);
      expect(trend).not.toBeNull();
      expect(trend!.phase).toBe("caballero");
      expect(trend!.mascot.src).toBe("/cid/caballero.svg");
      expect(trend!.patternName).toBe("Cid caballero");
      expect(trend!.patternDescription).toBe("Crecimiento moderado (+5% a +15%)");
      expect(trend!.rate).toBeGreaterThan(5);
      expect(trend!.rate).toBeLessThanOrEqual(15);
    });

    it("asigna Cid señor a una evolución plana (-5 % a +5 % anualizado)", () => {
      // 100 a 110 en 10 años -> ~0.95% anualizado
      const trend = calculateTenYearAnnualTrend([
        { date: "2016-01-01", close: 100 },
        { date: "2026-01-01", close: 110 },
      ]);
      expect(trend).not.toBeNull();
      expect(trend!.phase).toBe("senor");
      expect(trend!.mascot.src).toBe("/cid/senor.svg");
      expect(trend!.patternName).toBe("Cid señor");
      expect(trend!.patternDescription).toBe("Estancado o plano (-5% a +5%)");
    });

    it("asigna Cid piedra a una caída moderada (-5 % a -15 % anualizado)", () => {
      // 100 a 35 en 10 años -> ~-9.99% anualizado
      const trend = calculateTenYearAnnualTrend([
        { date: "2016-01-01", close: 100 },
        { date: "2026-01-01", close: 35 },
      ]);
      expect(trend).not.toBeNull();
      expect(trend!.phase).toBe("piedra");
      expect(trend!.mascot.src).toBe("/cid/piedra.svg");
      expect(trend!.patternName).toBe("Cid piedra");
      expect(trend!.patternDescription).toBe("Caída moderada (-5% a -15%)");
    });

    it("asigna Cid flecha a una caída grande (-15 % a -30 % anualizado)", () => {
      // 100 a 10 en 10 años -> ~-20.5% anualizado
      const trend = calculateTenYearAnnualTrend([
        { date: "2016-01-01", close: 100 },
        { date: "2026-01-01", close: 10 },
      ]);
      expect(trend).not.toBeNull();
      expect(trend!.phase).toBe("flecha");
      expect(trend!.mascot.src).toBe("/cid/flecha.svg");
      expect(trend!.patternName).toBe("Cid flecha");
      expect(trend!.patternDescription).toBe("Caída grande (-15% a -30%)");
    });

    it("asigna Cid apuñalado a un desplome menor al -30 % anualizado", () => {
      // 100 a 2 en 10 años -> ~-32.3% anualizado
      const trend = calculateTenYearAnnualTrend([
        { date: "2016-01-01", close: 100 },
        { date: "2026-01-01", close: 2 },
      ]);
      expect(trend).not.toBeNull();
      expect(trend!.phase).toBe("apunalado");
      expect(trend!.mascot.src).toBe("/cid/apunalado.svg");
      expect(trend!.patternName).toBe("Cid apuñalado");
      expect(trend!.patternDescription).toBe("Desplome (<-30%)");
    });
  });

  describe("rendimiento anualizado (CAGR) general con Cid en rangos > 1 año", () => {
    it("devuelve null si el periodo es inferior a 1 año", () => {
      // 6 meses
      const trend = calculatePriceAnnualTrend([
        { date: "2026-01-01", close: 100 },
        { date: "2026-07-01", close: 120 },
      ]);
      expect(trend).toBeNull();
    });

    it("calcula CAGR a 2 años y asigna la figura de Cid correcta (ej. Cid cuerda)", () => {
      // 100 a 144 en 2 años -> (144/100)^(1/2) - 1 = 20% anualizado
      const trend = calculatePriceAnnualTrend([
        { date: "2024-01-01", close: 100 },
        { date: "2026-01-01", close: 144 },
      ]);
      expect(trend).not.toBeNull();
      expect(trend!.years).toBeCloseTo(2.0, 1);
      expect(trend!.rate).toBeCloseTo(20.0, 0);
      expect(trend!.phase).toBe("cuerda");
      expect(trend!.mascot.src).toBe("/cid/cuerda.svg");
      expect(trend!.patternName).toBe("Cid cuerda");
    });

    it("calcula CAGR a 3 años y asigna Cid cañon si supera el 30 %", () => {
      // 100 a 230 en 3 años -> (230/100)^(1/3) - 1 = ~32.0% anualizado
      const trend = calculatePriceAnnualTrend([
        { date: "2023-01-01", close: 100 },
        { date: "2026-01-01", close: 230 },
      ]);
      expect(trend).not.toBeNull();
      expect(trend!.years).toBeCloseTo(3.0, 1);
      expect(trend!.rate).toBeGreaterThan(30);
      expect(trend!.phase).toBe("canon");
      expect(trend!.mascot.src).toBe("/cid/canon.svg");
      expect(trend!.patternName).toBe("Cid cañon");
    });

    it("calcula CAGR a 5 años y asigna Cid caballero para crecimiento moderado", () => {
      // 100 a 160 en 5 años -> (160/100)^(1/5) - 1 = ~9.86% anualizado
      const trend = calculatePriceAnnualTrend([
        { date: "2021-01-01", close: 100 },
        { date: "2026-01-01", close: 160 },
      ]);
      expect(trend).not.toBeNull();
      expect(trend!.years).toBeCloseTo(5.0, 1);
      expect(trend!.rate).toBeGreaterThan(5);
      expect(trend!.rate).toBeLessThanOrEqual(15);
      expect(trend!.phase).toBe("caballero");
      expect(trend!.mascot.src).toBe("/cid/caballero.svg");
      expect(trend!.patternName).toBe("Cid caballero");
    });

    it("calcula CAGR para histórico máximo de más de 10 años", () => {
      // 100 a 600 en 15 años -> ~12.6% anualizado
      const trend = calculatePriceAnnualTrend([
        { date: "2011-01-01", close: 100 },
        { date: "2026-01-01", close: 600 },
      ]);
      expect(trend).not.toBeNull();
      expect(trend!.years).toBeCloseTo(15.0, 1);
      expect(trend!.rate).toBeGreaterThan(10);
      expect(trend!.phase).toBe("caballero");
      expect(trend!.patternName).toBe("Cid caballero");
    });

    it("asigna Cid piedra para caídas moderadas a 3 años (-5% a -15% anual)", () => {
      // 100 a 72 en 3 años -> (72/100)^(1/3) - 1 = ~-10.37% anualizado
      const trend = calculatePriceAnnualTrend([
        { date: "2023-01-01", close: 100 },
        { date: "2026-01-01", close: 72 },
      ]);
      expect(trend).not.toBeNull();
      expect(trend!.rate).toBeLessThan(-5);
      expect(trend!.rate).toBeGreaterThan(-15);
      expect(trend!.phase).toBe("piedra");
      expect(trend!.mascot.src).toBe("/cid/piedra.svg");
      expect(trend!.patternName).toBe("Cid piedra");
    });

    it("asigna Cid apuñalado para desplomes severos a 2 años", () => {
      // 100 a 35 en 2 años -> (35/100)^(1/2) - 1 = ~-40.8% anualizado
      const trend = calculatePriceAnnualTrend([
        { date: "2024-01-01", close: 100 },
        { date: "2026-01-01", close: 35 },
      ]);
      expect(trend).not.toBeNull();
      expect(trend!.rate).toBeLessThan(-30);
      expect(trend!.phase).toBe("apunalado");
      expect(trend!.mascot.src).toBe("/cid/apunalado.svg");
      expect(trend!.patternName).toBe("Cid apuñalado");
    });
  });

  describe("animación del movimiento de Cid a lo largo de la curva", () => {
    it("genera un path suave con keyTimes proporcionales y fases de Cid", () => {
      const geometryPoints = [
        { index: 0, date: "2024-01-01", value: 100, x: 50, y: 200 },
        { index: 1, date: "2024-06-01", value: 120, x: 150, y: 170 },
        { index: 2, date: "2025-01-01", value: 150, x: 250, y: 130 },
        { index: 3, date: "2025-06-01", value: 180, x: 350, y: 90 },
        { index: 4, date: "2026-01-01", value: 220, x: 450, y: 50 },
      ];

      const plan = buildPriceMotionPlan(geometryPoints, "caballero");
      expect(plan.path).toMatch(/^M 50/);
      expect(plan.phases.length).toBeGreaterThan(0);
      expect(plan.keyTimes[0]).toBe(0);
      expect(plan.keyTimes.at(-1)).toBe(1);
    });

    it("mantiene la coordenada Y real de la cotización para acompañar la curva exacta", () => {
      const geometryPoints = [
        { index: 0, date: "2025-01-01", value: 100, x: 50, y: 300 },
        { index: 1, date: "2025-02-01", value: 150, x: 150, y: 180 },
        { index: 2, date: "2025-03-01", value: 200, x: 250, y: 80 },
      ];

      const trendPoints = buildThreeMonthTrendPoints(geometryPoints);
      // El punto 1 debe tener exactamente y = 180 (la curva de cotización), no la media Y
      expect(trendPoints[1].y).toBe(180);
      expect(trendPoints[2].y).toBe(80);
    });

    it("utiliza un Cid positivo ante un pico de caída grande si la media de 3 meses es positiva", () => {
      // Simular 3 meses de subida fuerte de 100 a 160 y un desplome diario puntual a 130 (-18% en un solo día)
      const allPrices = [
        { date: "2024-10-01", close: 100 },
        { date: "2024-11-01", close: 120 },
        { date: "2024-12-01", close: 140 },
        { date: "2024-12-30", close: 160 },
        { date: "2024-12-31", close: 130 }, // Pico brusco de caída diaria (-18.75%)
      ];

      const geometryPoints = [
        { index: 0, date: "2024-12-30", value: 160, x: 100, y: 50 },
        { index: 1, date: "2024-12-31", value: 130, x: 200, y: 120 }, // Caída brusca en el gráfico
      ];

      const plan = buildPriceMotionPlan(geometryPoints, "senor", allPrices);
      // El cambio en la media de 3 meses sigue siendo claramente positivo (~+30% sobre el trimestre anterior)
      expect(plan.phases[0]).toMatch(/^(caballero|cuerda|canon)$/);
      expect(plan.phases[0]).not.toBe("piedra");
      expect(plan.phases[0]).not.toBe("flecha");
      expect(plan.phases[0]).not.toBe("apunalado");
    });

    it("funciona de forma continua con historial completo en cualquier horizonte temporal (1Y, 3Y, 10Y)", () => {
      const fullHistory = [
        { date: "2023-01-01", close: 100 },
        { date: "2023-06-01", close: 110 },
        { date: "2024-01-01", close: 130 },
        { date: "2024-06-01", close: 160 },
        { date: "2025-01-01", close: 200 },
      ];

      // El usuario selecciona un rango de 1 año (2024 a 2025)
      const visibleRange = [
        { index: 0, date: "2024-01-01", value: 130, x: 50, y: 150 },
        { index: 1, date: "2024-06-01", value: 160, x: 250, y: 100 },
        { index: 2, date: "2025-01-01", value: 200, x: 450, y: 40 },
      ];

      const plan = buildPriceMotionPlan(visibleRange, "senor", fullHistory);
      expect(plan.phases.length).toBe(2);
      // Al disponer de historial previo, el primer punto ya dispone de comparativa de 3 meses positiva
      expect(plan.phases[0]).toBe("cuerda");
      expect(plan.phases[1]).toBe("cuerda");
    });
  });
});
