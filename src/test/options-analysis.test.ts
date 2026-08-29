import { describe, expect, it } from "vitest";
import { analyzeOptionExpiration } from "@/lib/options/analysis";
import type { OptionContractQuote, OptionSide } from "@/lib/options/types";

function contract(
  side: OptionSide,
  strike: number,
  overrides: Partial<OptionContractQuote> = {},
): OptionContractQuote {
  return {
    symbol: `TEST-${side}-${strike}`,
    side,
    expiration: "2026-11-20",
    strike,
    bid: 2,
    ask: 2.2,
    bidSize: 100,
    askSize: 50,
    last: 2.1,
    volume: 100,
    openInterest: 100,
    impliedVolatility: 0.3,
    delta: side === "call" ? 0.5 : -0.5,
    gamma: 0.03,
    theta: -0.05,
    vega: 0.1,
    underlyingPrice: 100,
    updatedAt: "2026-08-26T15:45:00.000Z",
    ...overrides,
  };
}

describe("Análisis de presión de opciones", () => {
  it("calcula ratios, rango ATM, walls y máximo dolor sin inventar dirección de cada trade", () => {
    const contracts = [
      contract("call", 90, { openInterest: 100, volume: 200 }),
      contract("put", 90, { openInterest: 100, volume: 50, bidSize: 30, askSize: 90 }),
      contract("call", 100, { openInterest: 500, volume: 1_000, bid: 5, ask: 5.2 }),
      contract("put", 100, { openInterest: 500, volume: 100, bid: 4.8, ask: 5, bidSize: 30, askSize: 90 }),
      contract("call", 110, { openInterest: 100, volume: 200 }),
      contract("put", 110, { openInterest: 100, volume: 50, bidSize: 30, askSize: 90 }),
    ];

    const result = analyzeOptionExpiration(contracts, 100, new Date("2026-08-26T12:00:00Z"));

    expect(result).not.toBeNull();
    expect(result!.putCallVolumeRatio).toBeCloseTo(200 / 1_400, 4);
    expect(result!.putCallOpenInterestRatio).toBe(1);
    expect(result!.expectedMove).toBeCloseTo(10, 4);
    expect(result!.expectedMovePct).toBeCloseTo(10, 4);
    expect(result!.expectedRangeLow).toBeCloseTo(90, 4);
    expect(result!.expectedRangeHigh).toBeCloseTo(110, 4);
    expect(result!.maxPain).toBe(100);
    expect(result!.callWall).toEqual({ strike: 100, openInterest: 500 });
    expect(result!.putWall).toEqual({ strike: 100, openInterest: 500 });
    expect(result!.pressureScore).toBeGreaterThan(0);
    expect(result!.unusualActivity[0]?.symbol).toBe("TEST-call-100");
  });

  it("usa volatilidad implícita cuando no existe un straddle cotizado", () => {
    const contracts = [
      contract("call", 100, { bid: null, ask: null, last: null, impliedVolatility: 0.4 }),
      contract("put", 100, { bid: null, ask: null, last: null, impliedVolatility: 0.4 }),
    ];

    const result = analyzeOptionExpiration(contracts, 100, new Date("2026-08-26T12:00:00Z"));

    expect(result?.expectedMoveMethod).toBe("Volatilidad implícita");
    expect(result?.expectedMove).toBeGreaterThan(15);
    expect(result?.expectedMove).toBeLessThan(25);
  });

  it("inclina la lectura a la baja cuando predominan puts y demanda visible de puts", () => {
    const contracts = [
      contract("call", 100, { volume: 100, openInterest: 100, bidSize: 10, askSize: 100 }),
      contract("put", 100, { volume: 1_000, openInterest: 800, bidSize: 200, askSize: 10 }),
    ];

    const result = analyzeOptionExpiration(contracts, 100, new Date("2026-08-26T12:00:00Z"));

    expect(result!.pressureScore).toBeLessThan(-35);
    expect(result!.pressureLabel).toBe("Fuerte inclinación vendedora");
  });
});
