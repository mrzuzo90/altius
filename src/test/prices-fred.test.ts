import { describe, expect, it } from "vitest";
import { parseAlphaVantage } from "@/lib/prices/alpha-vantage";
import { parseFredCsv, yoyChange } from "@/lib/fred/client";

describe("parseAlphaVantage", () => {
  it("extrae los cierres y los ordena de más antiguo a más reciente", () => {
    const r = parseAlphaVantage({
      "Time Series (Daily)": {
        "2024-01-03": { "1. open": "184.2", "4. close": "184.25" },
        "2024-01-02": { "1. open": "187.1", "4. close": "185.64" },
      },
    });
    expect(r).toEqual({
      ok: true,
      points: [
        { date: "2024-01-02", close: 185.64 },
        { date: "2024-01-03", close: 184.25 },
      ],
    });
  });

  it("detecta el límite de cuota, que llega con HTTP 200", () => {
    const r = parseAlphaVantage({ Note: "Thank you for using Alpha Vantage!" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("rate-limited");
  });

  it("distingue un símbolo inexistente de un fallo genérico", () => {
    const r = parseAlphaVantage({ "Error Message": "Invalid API call" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("not-found");
  });

  it("no revienta ante una respuesta vacía", () => {
    expect(parseAlphaVantage({}).ok).toBe(false);
    expect(parseAlphaVantage({ "Time Series (Daily)": {} }).ok).toBe(false);
  });
});

describe("parseFredCsv", () => {
  it("parsea el formato actual con cabecera observation_date", () => {
    expect(parseFredCsv("observation_date,CPIAUCSL\n1947-01-01,21.480\n1947-02-01,21.620\n")).toEqual([
      { date: "1947-01-01", value: 21.48 },
      { date: "1947-02-01", value: 21.62 },
    ]);
  });

  it("descarta los datos ausentes marcados con punto en lugar de leerlos como cero", () => {
    const p = parseFredCsv("observation_date,DEXUSEU\n2024-01-01,.\n2024-01-02,1.0951\n");
    expect(p).toEqual([{ date: "2024-01-02", value: 1.0951 }]);
    expect(p.some((x) => x.value === 0)).toBe(false);
  });

  it("devuelve lista vacía ante un CSV sin observaciones", () => {
    expect(parseFredCsv("observation_date,UNRATE")).toEqual([]);
    expect(parseFredCsv("")).toEqual([]);
  });
});

describe("yoyChange", () => {
  it("calcula la variación interanual sobre trece observaciones mensuales", () => {
    const puntos = Array.from({ length: 13 }, (_, i) => ({
      date: `2024-${String(i + 1).padStart(2, "0")}-01`,
      value: 100 + i * 1,
    }));
    const yoy = yoyChange(puntos);
    expect(yoy).toHaveLength(1);
    expect(yoy[0].value).toBeCloseTo(12);
  });

  it("no produce puntos si no hay un año completo de historia", () => {
    expect(yoyChange([{ date: "2024-01-01", value: 100 }])).toEqual([]);
  });
});
