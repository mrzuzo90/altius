import { describe, expect, it } from "vitest";
import { rankTickers, type TickerHit } from "@/lib/sec/tickers";

// Forma real de company_tickers.json: objeto indexado por número, no array.
const CRUDO = {
  "0": { cik_str: 1045810, ticker: "NVDA", title: "NVIDIA CORP" },
  "1": { cik_str: 320193, ticker: "AAPL", title: "Apple Inc." },
  "2": { cik_str: 1318605, ticker: "TSLA", title: "Tesla, Inc." },
  "3": { cik_str: 200406, ticker: "JNJ", title: "JOHNSON & JOHNSON" },
  "4": { cik_str: 1090727, ticker: "AAP", title: "APPLE HOSPITALITY REIT" },
  "5": { cik_str: 789019, ticker: "MSFT", title: "MICROSOFT CORP" },
};

const buscar = (q: string, limite = 10): TickerHit[] => rankTickers(CRUDO, q, limite);

describe("rankTickers", () => {
  it("normaliza el objeto indexado a hits tipados con el CIK relleno", () => {
    const [hit] = buscar("AAPL");
    expect(hit).toEqual({ ticker: "AAPL", cik: "0000320193", name: "Apple Inc." });
  });

  it("prioriza la coincidencia exacta de ticker sobre la parcial", () => {
    // "AAP" es ticker exacto de Apple Hospitality y prefijo de AAPL.
    expect(buscar("AAP")[0].ticker).toBe("AAP");
  });

  it("encuentra por nombre de empresa sin distinguir mayúsculas", () => {
    expect(buscar("johnson")[0].ticker).toBe("JNJ");
  });

  it("encuentra por nombre parcial en mitad del título", () => {
    expect(buscar("hospitality")[0].ticker).toBe("AAP");
  });

  it("devuelve lista vacía con query vacía o de solo espacios", () => {
    expect(buscar("")).toEqual([]);
    expect(buscar("   ")).toEqual([]);
  });

  it("devuelve lista vacía si nada coincide", () => {
    expect(buscar("zzzzquenoexiste")).toEqual([]);
  });

  it("respeta el límite solicitado", () => {
    expect(buscar("a", 2)).toHaveLength(2);
  });
});

describe("relevancia entre nombres que comparten prefijo", () => {
  const CON_HOMONIMOS = {
    "0": { cik_str: 1134982, ticker: "AAPI", title: "Apple iSports Group, Inc." },
    "1": { cik_str: 320193, ticker: "AAPL", title: "Apple Inc." },
    "2": { cik_str: 1418121, ticker: "APLE", title: "Apple Hospitality REIT, Inc." },
  };

  it("antepone la empresa cuyo nombre coincide más ajustadamente", () => {
    // Los tres empiezan por "Apple" y empatan a puntos. Desempatando por orden
    // alfabético del ticker, Apple Inc. quedaba detrás de Apple iSports Group.
    const r = rankTickers(CON_HOMONIMOS, "apple");
    expect(r[0].ticker).toBe("AAPL");
    expect(r.map((h) => h.ticker)).toEqual(["AAPL", "AAPI", "APLE"]);
  });

  it("la coincidencia exacta de ticker sigue mandando sobre el nombre", () => {
    expect(rankTickers(CON_HOMONIMOS, "APLE")[0].ticker).toBe("APLE");
  });
});
