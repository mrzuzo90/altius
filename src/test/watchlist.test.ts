import { describe, expect, it } from "vitest";
import {
  inferTargetDirection,
  isTargetReached,
  sanitizeStoredWatchlist,
  targetDistancePct,
  targetProgressPct,
} from "@/lib/watchlist/calculations";

describe("Lista de favoritas y objetivos", () => {
  it("infiere correctamente si el aviso debe ser por subida o por caída", () => {
    expect(inferTargetDirection(120, 100)).toBe("above");
    expect(inferTargetDirection(80, 100)).toBe("below");
    expect(inferTargetDirection(100, 100)).toBe("above");
  });

  it("detecta objetivos alcanzados en ambas direcciones", () => {
    expect(isTargetReached(121, 120, "above")).toBe(true);
    expect(isTargetReached(119, 120, "above")).toBe(false);
    expect(isTargetReached(79, 80, "below")).toBe(true);
    expect(isTargetReached(81, 80, "below")).toBe(false);
    expect(isTargetReached(100, null, null)).toBe(false);
  });

  it("calcula distancia y progreso sin superar los límites 0-100", () => {
    expect(targetDistancePct(100, 120, "above")).toBeCloseTo(20);
    expect(targetDistancePct(100, 80, "below")).toBeCloseTo(20);
    expect(targetProgressPct(110, 100, 120, "above")).toBeCloseTo(50);
    expect(targetProgressPct(90, 100, 80, "below")).toBeCloseTo(50);
    expect(targetProgressPct(130, 100, 120, "above")).toBe(100);
    expect(targetProgressPct(110, 100, 120, "above")).toBeCloseTo(50);
    expect(targetProgressPct(90, 100, 120, "above")).toBe(0);
  });

  it("sanea la persistencia manipulada y elimina duplicados", () => {
    const result = sanitizeStoredWatchlist([
      {
        ticker: "aapl",
        companyName: "Apple Inc.",
        targetPrice: 250,
        targetDirection: "above",
        referencePrice: 200,
        currency: "usd",
        createdAt: "2026-08-26T10:00:00.000Z",
        updatedAt: "2026-08-26T10:00:00.000Z",
        status: "watching",
      },
      { ticker: "AAPL", companyName: "duplicada" },
      { ticker: "<script>", companyName: "inválida" },
      { ticker: "MSFT", companyName: "Microsoft", targetPrice: -5, targetDirection: "below" },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ ticker: "AAPL", targetPrice: 250, targetDirection: "above", currency: "USD" });
    expect(result[1]).toMatchObject({ ticker: "MSFT", targetPrice: null, targetDirection: null });
  });
});
