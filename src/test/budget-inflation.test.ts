import { describe, expect, it } from "vitest";
import {
  calculatePersonalInflation,
  INFLATION_PRESETS,
  INVESTMENT_PRESETS,
} from "@/lib/budget/inflation";

describe("Calculadora de Inflación para Finanzas Personales", () => {
  it("calcula la pérdida de poder adquisitivo del dinero en efectivo (0% rentabilidad)", () => {
    // 10.000 € a 5 años con un 3% de inflación anual
    const result = calculatePersonalInflation(10000, 5, 3.0, 0);

    expect(result.initialAmount).toBe(10000);
    expect(result.years).toBe(5);
    // 10000 / (1.03^5) = 8626.09
    expect(result.futurePurchasingPower).toBeCloseTo(8626.09, 2);
    // Pérdida silenciosa = 1373.91
    expect(result.silentLoss).toBeCloseTo(1373.91, 2);
    expect(result.silentLossPct).toBeCloseTo(-13.7, 1);
    // Coste equivalente de vida futuro = 10000 * 1.03^5 = 11592.74
    expect(result.futureEquivalentCost).toBeCloseTo(11592.74, 2);
    expect(result.extraCostNeeded).toBeCloseTo(1592.74, 2);
  });

  it("calcula la rentabilidad real neta cuando se invierte el dinero", () => {
    // 10.000 € a 5 años con 7% de rendimiento y 3% de inflación
    const result = calculatePersonalInflation(10000, 5, 3.0, 7.0);

    // Saldo nominal: 10000 * (1.07^5) = 14025.52
    expect(result.futureInvestedNominal).toBeCloseTo(14025.52, 2);
    // Poder de compra real: 14025.52 / (1.03^5) = 12098.54
    expect(result.futureInvestedReal).toBeCloseTo(12098.54, 2);
    // Ganancia neta real en poder de compra: 2098.54 € (+21.0%)
    expect(result.realNetProfit).toBeCloseTo(2098.54, 2);
    expect(result.realNetProfitPct).toBeCloseTo(21.0, 1);
  });

  it("genera la proyección anual cronológica completa desde el año 0", () => {
    const years = 10;
    const result = calculatePersonalInflation(5000, years, 2.5, 5.0);

    expect(result.timeline.length).toBe(years + 1);

    const year0 = result.timeline[0];
    expect(year0.year).toBe(0);
    expect(year0.cashNominal).toBe(5000);
    expect(year0.cashReal).toBe(5000);
    expect(year0.investedNominal).toBe(5000);
    expect(year0.investedReal).toBe(5000);

    const yearLast = result.timeline[years];
    expect(yearLast.year).toBe(years);
    expect(yearLast.cashReal).toBe(result.futurePurchasingPower);
    expect(yearLast.investedReal).toBe(result.futureInvestedReal);
  });

  it("asigna mascotas de Cid coherentes para efectivo e inversión sin etiquetas de texto", () => {
    // Inflación alta (5%) durante 15 años en efectivo => fuerte castigo (flecha o apunalado)
    const highLossResult = calculatePersonalInflation(10000, 15, 5.0, 0);
    expect(["/cid/flecha.svg", "/cid/apunalado.svg"]).toContain(
      highLossResult.mascotCash.src,
    );

    // Inversión con alto rendimiento real (10% rendimiento vs 2% inflación a 10 años) => canon
    const highGainResult = calculatePersonalInflation(10000, 10, 2.0, 10.0);
    expect(highGainResult.mascotInvested.src).toBe("/cid/canon.svg");
  });

  it("contiene los presets oficiales de inflación e inversión requeridos", () => {
    expect(INFLATION_PRESETS.length).toBeGreaterThanOrEqual(4);
    expect(INFLATION_PRESETS.some((p) => p.id === "ecb_target")).toBe(true);
    expect(INFLATION_PRESETS.some((p) => p.id === "eurozone_recent")).toBe(true);
    expect(INFLATION_PRESETS.some((p) => p.id === "us_recent")).toBe(true);

    expect(INVESTMENT_PRESETS.length).toBeGreaterThanOrEqual(3);
    expect(INVESTMENT_PRESETS.some((p) => p.id === "cash")).toBe(true);
    expect(INVESTMENT_PRESETS.some((p) => p.id === "index_funds")).toBe(true);
  });
});
