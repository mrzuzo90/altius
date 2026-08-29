import { describe, expect, it } from "vitest";
import {
  coreSearchQuery,
  normalizeSearchText,
  rankGlobalSearch,
  type SearchCandidate,
} from "@/lib/search/ranking";

const candidate = (overrides: Partial<SearchCandidate>): SearchCandidate => ({
  id: "company:test",
  kind: "company",
  symbol: "TEST",
  name: "Test Company",
  href: "/ticker/TEST",
  meta: "Empresa",
  ...overrides,
});

describe("rankGlobalSearch", () => {
  it("coloca siempre un ticker exacto por encima de coincidencias parciales", () => {
    const results = rankGlobalSearch("AAP", [
      candidate({ id: "aapl", symbol: "AAPL", name: "Apple Inc." }),
      candidate({ id: "aap", symbol: "AAP", name: "Advance Auto Parts, Inc." }),
    ]);
    expect(results.map((result) => result.symbol)).toEqual(["AAP", "AAPL"]);
  });

  it("reconoce el nombre principal sin que moleste la forma jurídica", () => {
    const results = rankGlobalSearch("Apple", [
      candidate({ id: "hospitality", symbol: "APLE", name: "Apple Hospitality REIT, Inc." }),
      candidate({ id: "apple", symbol: "AAPL", name: "Apple Inc." }),
    ]);
    expect(results[0].symbol).toBe("AAPL");
    expect(results[0].match).toBe("exact");
  });

  it("elimina cotizaciones duplicadas de la misma compañía", () => {
    const results = rankGlobalSearch("Apple", [
      candidate({ id: "apple-us", symbol: "AAPL", name: "Apple Inc." }),
      candidate({ id: "apple-de", symbol: "APC.DE", name: "Apple Inc." }),
      candidate({ id: "hospitality", symbol: "APLE", name: "Apple Hospitality REIT, Inc." }),
    ]);
    expect(results.map((result) => result.symbol)).toEqual(["AAPL", "APLE"]);
  });

  it("entiende nombres habituales y alias de empresas globales", () => {
    const results = rankGlobalSearch("Louis Vuitton", [
      candidate({
        id: "lvmh",
        symbol: "MC.PA",
        name: "LVMH Moët Hennessy Louis Vuitton SE",
        aliases: ["LVMH", "Louis Vuitton"],
      }),
      candidate({ id: "other", symbol: "LVS", name: "Las Vegas Sands Corp" }),
    ]);
    expect(results[0].symbol).toBe("MC.PA");
    expect(results[0].match).toBe("alias");
  });

  it("respeta la intención explícita cuando se busca otra clase de activo", () => {
    const results = rankGlobalSearch("divisa euro", [
      candidate({ id: "euro-company", symbol: "EURO", name: "Euro Company Inc." }),
      candidate({
        id: "eurusd",
        kind: "currency",
        symbol: "EURUSD",
        shortName: "EUR/USD",
        name: "Euro / Dólar Estadounidense",
        aliases: ["divisa", "euro"],
        href: "/divisas/eur-usd",
      }),
    ]);
    expect(results[0].kind).toBe("currency");
  });

  it("acepta búsquedas escritas de forma natural", () => {
    expect(coreSearchQuery("empresa Apple")).toBe("APPLE");
    const results = rankGlobalSearch("empresa Apple", [
      candidate({ id: "apple", symbol: "AAPL", name: "Apple Inc." }),
      candidate({ id: "hospitality", symbol: "APLE", name: "Apple Hospitality REIT, Inc." }),
    ]);
    expect(results[0].symbol).toBe("AAPL");
  });

  it("tolera una errata corta sin desplazar una coincidencia exacta", () => {
    const results = rankGlobalSearch("NVIDA", [
      candidate({ id: "nvidia", symbol: "NVDA", name: "NVIDIA Corp" }),
      candidate({ id: "nvida", symbol: "NVIDA", name: "Nvida Holdings" }),
    ]);
    expect(results[0].symbol).toBe("NVIDA");
    expect(results.some((result) => result.symbol === "NVDA" && result.match === "fuzzy")).toBe(true);
  });
});

describe("normalizeSearchText", () => {
  it("ignora acentos y separadores", () => {
    expect(normalizeSearchText("  Louis-Vuittón, S.E. ")).toBe("LOUIS VUITTON S E");
  });
});
