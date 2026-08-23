import { describe, expect, it } from "vitest";
import {
  COMMODITIES,
  computeCommoditySummary,
  getAllCommodities,
  resolveCommoditySymbol,
} from "@/lib/commodities";
import type { PricePoint } from "@/lib/prices/types";

describe("Módulo de Materias Primas (Commodities)", () => {
  it("resuelve alias de materias primas correctamente", () => {
    expect(resolveCommoditySymbol("ORO")?.symbol).toBe("GOLD");
    expect(resolveCommoditySymbol("GOLD")?.symbol).toBe("GOLD");
    expect(resolveCommoditySymbol("XAU")?.symbol).toBe("GOLD");
    expect(resolveCommoditySymbol("BRENT")?.symbol).toBe("BRENT");
    expect(resolveCommoditySymbol("PETROLEO")?.symbol).toBe("BRENT");
    expect(resolveCommoditySymbol("WTI")?.symbol).toBe("WTI");
    expect(resolveCommoditySymbol("GAS NATURAL")?.symbol).toBe("NATGAS");
    expect(resolveCommoditySymbol("COBRE")?.symbol).toBe("COPPER");
    expect(resolveCommoditySymbol("PLATA")?.symbol).toBe("SILVER");
    expect(resolveCommoditySymbol("TRIGO")?.symbol).toBe("WHEAT");
    expect(resolveCommoditySymbol("MAIZ")?.symbol).toBe("CORN");
    expect(resolveCommoditySymbol("INEXISTENTE")).toBeNull();
  });

  it("devuelve la lista completa y filtra por categorías", () => {
    const all = getAllCommodities();
    expect(all.length).toBe(8);

    const energy = getAllCommodities("energy");
    expect(energy.length).toBe(3);
    expect(energy.map((e) => e.symbol)).toContain("BRENT");
    expect(energy.map((e) => e.symbol)).toContain("WTI");
    expect(energy.map((e) => e.symbol)).toContain("NATGAS");

    const precious = getAllCommodities("precious_metals");
    expect(precious.length).toBe(2);
    expect(precious.map((p) => p.symbol)).toContain("GOLD");
    expect(precious.map((p) => p.symbol)).toContain("SILVER");

    const agri = getAllCommodities("agriculture");
    expect(agri.length).toBe(2);
  });

  it("calcula el resumen de variaciones, máximos y unidades de cotización", () => {
    const points: PricePoint[] = [
      { date: "2025-01-01", close: 2000 },
      { date: "2025-06-01", close: 2200 },
      { date: "2025-12-01", close: 2400 },
      { date: "2026-01-02", close: 2450 },
      { date: "2026-05-01", close: 2600 }, // ATH
      { date: "2026-08-20", close: 2510 },
    ];

    const summary = computeCommoditySummary("GOLD", points);
    expect(summary.currentValue).toBe(2510);
    expect(summary.unit).toBe(COMMODITIES.GOLD.unit);
    expect(summary.ath).toBe(2600);
    expect(summary.athDate).toBe("2026-05-01");
    expect(summary.drawdownFromAthPct).toBeCloseTo(((2510 - 2600) / 2600) * 100, 2);
    expect(summary.high52w).toBe(2600);
    expect(summary.low52w).toBe(2000);
  });
});
