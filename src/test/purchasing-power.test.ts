import { describe, expect, it } from "vitest";
import {
  calculatePurchasingPower,
  PURCHASING_POWER_RANGES,
} from "@/lib/macro/purchasing-power";

describe("Cálculo de Pérdida de Poder Adquisitivo (Base 100)", () => {
  const mockCpiPoints = [
    { date: "2016-01-01", value: 100 },
    { date: "2018-01-01", value: 105 },
    { date: "2020-01-01", value: 110 },
    { date: "2022-01-01", value: 120 },
    { date: "2024-01-01", value: 130 },
    { date: "2026-01-01", value: 140 },
  ];

  it("la serie arranca exactamente en 100.00 en la fecha inicial", () => {
    const result = calculatePurchasingPower(mockCpiPoints, "max");
    expect(result).not.toBeNull();
    expect(result!.initialValue).toBe(100.0);
    expect(result!.series[0].value).toBe(100.0);
    expect(result!.series[0].lossPct).toBe(0.0);
  });

  it("calcula fielmente la erosión del valor real de 100 unidades", () => {
    // Si el índice subió de 100 a 140 (+40%), 100 unidades compran: 100 * (100 / 140) = 71.43
    const result = calculatePurchasingPower(mockCpiPoints, "max");
    expect(result).not.toBeNull();
    expect(result!.finalValue).toBeCloseTo(71.43, 2);
    expect(result!.totalLossPct).toBeCloseTo(-28.57, 2);
    expect(result!.annualInflationRate).toBeGreaterThan(0);
  });

  it("filtra de forma precisa según el horizonte temporal solicitado", () => {
    const result3y = calculatePurchasingPower(mockCpiPoints, "3y");
    expect(result3y).not.toBeNull();
    expect(result3y!.series[0].value).toBe(100.0);
    // Para 3 años desde 2026-01-01 el cutoff es ~2023-01-01, toma el punto 2024 (130) como base
    expect(result3y!.startDate).toBe("2024-01-01");
    expect(result3y!.endDate).toBe("2026-01-01");
    // 100 * (130 / 140) = 92.86
    expect(result3y!.finalValue).toBeCloseTo(92.86, 2);
    expect(result3y!.totalLossPct).toBeCloseTo(-7.14, 2);
  });

  it("asigna la figura de Cid correspondiente a la gravedad de la pérdida", () => {
    // Pérdida severa (-25% a -35%): flecha
    const severeResult = calculatePurchasingPower(mockCpiPoints, "max");
    expect(severeResult!.mascot.src).toBe("/cid/flecha.svg");

    // Pérdida catastrófica (>35%): apunalado (ej. 100 a 180 = -44.4% de poder adquisitivo)
    const catastrophicPoints = [
      { date: "2010-01-01", value: 100 },
      { date: "2026-01-01", value: 180 },
    ];
    const catastrophicResult = calculatePurchasingPower(catastrophicPoints, "max");
    expect(catastrophicResult!.mascot.src).toBe("/cid/apunalado.svg");

    // Pérdida moderada (5% a 15%): caballero
    const moderateResult = calculatePurchasingPower(mockCpiPoints, "3y");
    expect(moderateResult!.mascot.src).toBe("/cid/caballero.svg");
  });

  it("maneja datos insuficientes de forma segura devolviendo null", () => {
    expect(calculatePurchasingPower([], "5y")).toBeNull();
    expect(calculatePurchasingPower([{ date: "2026-01-01", value: 100 }], "5y")).toBeNull();
  });
});
