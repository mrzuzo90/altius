import { describe, expect, it } from "vitest";
import {
  calculateBudgetBreakdown,
  calculateCompoundInterest,
  generateCompoundInterestYearlySeries,
} from "@/lib/budget/calculations";
import { BUDGET_CATEGORIES, COMPOUND_INTEREST_PRESETS } from "@/lib/budget/types";

describe("calculateBudgetBreakdown", () => {
  it("calcula el desglose con las 6 proporciones recomendadas oficiales (30/20/15/15/10/10)", () => {
    const res = calculateBudgetBreakdown(2000);

    expect(res.monthlyIncome).toBe(2000);
    expect(res.annualIncome).toBe(24000);
    expect(res.totalPct).toBe(100);
    expect(res.isBalanced).toBe(true);
    expect(res.totalAllocated).toBe(2000);

    const map = Object.fromEntries(res.items.map((it) => [it.config.id, it]));

    // Vivienda: 30% -> 600 €
    expect(map.vivienda.pct).toBe(30);
    expect(map.vivienda.amount).toBe(600);
    expect(map.vivienda.annualAmount).toBe(7200);

    // Ahorro e Inversión: 20% -> 400 €
    expect(map.ahorro.pct).toBe(20);
    expect(map.ahorro.amount).toBe(400);
    expect(map.ahorro.annualAmount).toBe(4800);

    // Comida: 15% -> 300 €
    expect(map.comida.pct).toBe(15);
    expect(map.comida.amount).toBe(300);

    // Ocio / Estilo de vida: 15% -> 300 €
    expect(map.ocio.pct).toBe(15);
    expect(map.ocio.amount).toBe(300);

    // Suministros y Servicios: 10% -> 200 €
    expect(map.suministros.pct).toBe(10);
    expect(map.suministros.amount).toBe(200);

    // Otros / Imprevistos: 10% -> 200 €
    expect(map.otros.pct).toBe(10);
    expect(map.otros.amount).toBe(200);

    // Exportación directa del ahorro
    expect(res.savingItem.amount).toBe(400);
  });

  it("permite modificar porcentajes personalizados e identifica desequilibrios", () => {
    // 35 + 25 + 15 + 15 + 10 + 10 = 110% (excede en 10%)
    const res = calculateBudgetBreakdown(3000, {
      vivienda: 35,
      ahorro: 25,
    });

    expect(res.totalPct).toBe(110);
    expect(res.isBalanced).toBe(false);
    expect(res.remainingPct).toBe(-10);
    expect(res.totalAllocated).toBe(3300);

    const map = Object.fromEntries(res.items.map((it) => [it.config.id, it]));
    expect(map.vivienda.pct).toBe(35);
    expect(map.vivienda.isDefaultPct).toBe(false);
    expect(map.vivienda.amount).toBe(1050);

    expect(map.ahorro.pct).toBe(25);
    expect(map.ahorro.isDefaultPct).toBe(false);
    expect(map.ahorro.amount).toBe(750);
  });

  it("maneja ingresos cero o negativos sin romper", () => {
    const res = calculateBudgetBreakdown(0);
    expect(res.monthlyIncome).toBe(0);
    expect(res.totalAllocated).toBe(0);
    expect(res.savingItem.amount).toBe(0);

    const neg = calculateBudgetBreakdown(-500);
    expect(neg.monthlyIncome).toBe(0);
  });
});

describe("calculateCompoundInterest", () => {
  it("calcula la capitalización con aportaciones mensuales según la fórmula estándar", () => {
    // P = 1.000 €, PMT = 400 €, 10 años, 10% (S&P 500)
    const result = calculateCompoundInterest(1000, 400, 10, 10);

    // Total aportado = 1.000 + 400 * 120 = 49.000 €
    expect(result.totalContributed).toBe(49000);

    // Capital final aproximado: ~84.645 €
    expect(result.futureValue).toBeGreaterThan(84000);
    expect(result.futureValue).toBeLessThan(85000);

    // Intereses generados > 35.000 €
    expect(result.totalInterest).toBe(result.futureValue - result.totalContributed);
    expect(result.totalInterest).toBeGreaterThan(35000);

    // Multiplicador > 1.7x
    expect(result.multiplier).toBeGreaterThan(1.7);
  });

  it("aplica los preajustes oficiales con exactitud", () => {
    const sp = COMPOUND_INTEREST_PRESETS.find((p) => p.id === "sp500")!;
    expect(sp.ratePct).toBe(10.0);

    const nasdaq = COMPOUND_INTEREST_PRESETS.find((p) => p.id === "nasdaq")!;
    expect(nasdaq.ratePct).toBe(12.5);

    const msci = COMPOUND_INTEREST_PRESETS.find((p) => p.id === "msci_world")!;
    expect(msci.ratePct).toBe(8.0);

    const euro = COMPOUND_INTEREST_PRESETS.find((p) => p.id === "eurostoxx")!;
    expect(euro.ratePct).toBe(6.0);

    const ibex = COMPOUND_INTEREST_PRESETS.find((p) => p.id === "ibex35")!;
    expect(ibex.ratePct).toBe(4.5);

    const bono = COMPOUND_INTEREST_PRESETS.find((p) => p.id === "bono_renta_fija")!;
    expect(bono.ratePct).toBe(3.5);
  });

  it("maneja tasa de interés cero (simple acumulación)", () => {
    const res = calculateCompoundInterest(500, 200, 5, 0);
    // 500 + 200 * 60 = 12.500 €
    expect(res.futureValue).toBe(12500);
    expect(res.totalContributed).toBe(12500);
    expect(res.totalInterest).toBe(0);
    expect(res.multiplier).toBe(1);
  });

  it("genera la serie anual completa para el gráfico", () => {
    const series = generateCompoundInterestYearlySeries(1000, 200, 5, 8);
    expect(series).toHaveLength(6); // Año 0 (Inicio) hasta Año 5
    expect(series[0].year).toBe(0);
    expect(series[0].label).toBe("Inicio");
    expect(series[0].totalAccumulated).toBe(1000);
    expect(series[5].year).toBe(5);
    expect(series[5].totalAccumulated).toBeGreaterThan(series[5].totalContributed);
  });
});
