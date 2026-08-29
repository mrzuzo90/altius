import { describe, expect, it } from "vitest";
import { QUALITY_SCREENER_UNIVERSE } from "@/lib/quality-screener/universe";

describe("quality screener universe", () => {
  it("mantiene un universo reproducible de 100 compañías sin duplicados", () => {
    const tickers = QUALITY_SCREENER_UNIVERSE.map((company) => company.ticker);

    expect(tickers).toHaveLength(100);
    expect(new Set(tickers).size).toBe(100);
  });

  it("incluye compañías estadounidenses, europeas, canadienses y australianas/globales", () => {
    const regions = new Set(QUALITY_SCREENER_UNIVERSE.map((company) => company.region));

    expect(regions).toEqual(new Set([
      "Estados Unidos",
      "Europa",
      "Canadá",
      "Australia/global",
    ]));
  });
});
