import { describe, expect, it } from "vitest";
import { parseAlphaVantage } from "@/lib/prices/alpha-vantage";
import { stitchPriceSegments } from "@/lib/prices";
import { filterPricePoints, priceRangeCutoff } from "@/lib/prices/ranges";
import { parseFredCsv, yoyChange } from "@/lib/fred/client";

describe("parseAlphaVantage", () => {
  it("extrae los cierres y los ordena de más antiguo a más reciente", () => {
    const r = parseAlphaVantage({
      "Weekly Time Series": {
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
    expect(parseAlphaVantage({ "Weekly Time Series": {} }).ok).toBe(false);
  });

  it("localiza la serie sea diaria, semanal o mensual", () => {
    // La clave cambia según el endpoint, y el plan gratuito obliga a usar el
    // semanal porque el histórico completo del diario es de pago.
    for (const clave of ["Time Series (Daily)", "Weekly Time Series", "Monthly Time Series"]) {
      const r = parseAlphaVantage({ [clave]: { "2024-01-02": { "4. close": "185.64" } } });
      expect(r.ok, clave).toBe(true);
      if (r.ok) expect(r.points).toEqual([{ date: "2024-01-02", close: 185.64 }]);
    }
  });

  it("ignora la sección de metadatos al buscar la serie", () => {
    const r = parseAlphaVantage({
      "Meta Data": { "1. Information": "Weekly Prices" },
      "Weekly Time Series": { "2024-01-05": { "4. close": "181.18" } },
    });
    expect(r.ok).toBe(true);
  });

  it("prefiere el cierre ajustado, porque el crudo ignora los splits", () => {
    // Datos reales de NVIDIA. El split 10:1 de junio de 2024 hace que el cierre
    // crudo de esa semana sea 1.208,88 y el ajustado 120,68. Tomando el crudo,
    // el gráfico dibuja un desplome del 90 % que nunca sucedió.
    const r = parseAlphaVantage({
      "Weekly Adjusted Time Series": {
        "2024-06-07": { "4. close": "1208.8800", "5. adjusted close": "120.6800" },
        "2026-08-19": { "4. close": "217.5600", "5. adjusted close": "217.5600" },
      },
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.points[0]).toEqual({ date: "2024-06-07", close: 120.68 });
      // Sin ajustar, el histórico dejaría a NVIDIA por debajo de su precio
      // actual pese a haberse multiplicado por doce desde 2021.
      expect(r.points[0].close).toBeLessThan(r.points[1].close);
    }
  });

  it("recae en el cierre crudo si el proveedor no da ajustado", () => {
    const r = parseAlphaVantage({
      "Weekly Time Series": { "2024-01-02": { "4. close": "185.64" } },
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.points[0].close).toBe(185.64);
  });

  it("detecta el bloqueo de outputsize=full, que llega como Information", () => {
    const r = parseAlphaVantage({
      Information: "The outputsize=full parameter value is a premium feature",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("rate-limited");
  });
});

describe("granularidad de la cotización histórica", () => {
  it("sustituye el solapamiento mensual por semanal y el semanal por diario", () => {
    const stitched = stitchPriceSegments([
      [
        { date: "2024-01-01", close: 10 },
        { date: "2024-04-01", close: 11 },
        { date: "2024-07-01", close: 12 },
      ],
      [
        { date: "2024-06-03", close: 20 },
        { date: "2024-06-10", close: 21 },
        { date: "2024-11-11", close: 22 },
      ],
      [
        { date: "2024-11-08", close: 30 },
        { date: "2024-11-11", close: 31 },
        { date: "2024-11-12", close: 32 },
      ],
    ]);

    expect(stitched.map((point) => point.date)).toEqual([
      "2024-01-01",
      "2024-04-01",
      "2024-06-03",
      "2024-06-10",
      "2024-11-08",
      "2024-11-11",
      "2024-11-12",
    ]);
    expect(stitched.find((point) => point.date === "2024-11-11")?.close).toBe(31);
  });

  it("calcula 3 meses, año actual y ejercicio fiscal por fechas reales", () => {
    const points = [
      { date: "2025-09-27", close: 10 },
      { date: "2025-09-28", close: 11 },
      { date: "2026-01-01", close: 12 },
      { date: "2026-05-25", close: 13 },
      { date: "2026-08-25", close: 14 },
    ];

    expect(filterPricePoints(points, "3m").map((point) => point.date)).toEqual([
      "2026-05-25",
      "2026-08-25",
    ]);
    expect(filterPricePoints(points, "ytd").map((point) => point.date)).toEqual([
      "2026-01-01",
      "2026-05-25",
      "2026-08-25",
    ]);
    expect(filterPricePoints(points, "fytd", { fiscalYearStart: "2025-09-28" })[0].date)
      .toBe("2025-09-27");
  });

  it("resta meses y años naturales, incluidos finales de mes y años bisiestos", () => {
    expect(priceRangeCutoff("2025-03-31", "1m")).toBe("2025-02-28");
    expect(priceRangeCutoff("2024-03-31", "1m")).toBe("2024-02-29");
    expect(priceRangeCutoff("2026-08-31", "3m")).toBe("2026-05-31");
    expect(priceRangeCutoff("2024-02-29", "1y")).toBe("2023-02-28");
  });

  it("incluye el cierre anterior cuando el inicio cae en fin de semana", () => {
    const points = [
      { date: "2026-07-24", close: 100 },
      { date: "2026-07-27", close: 103 },
      { date: "2026-08-26", close: 110 },
    ];
    expect(filterPricePoints(points, "1m").map((point) => point.date)).toEqual([
      "2026-07-24",
      "2026-07-27",
      "2026-08-26",
    ]);
  });

  it("no añade observaciones externas a un periodo personalizado", () => {
    const points = [
      { date: "2026-07-24", close: 100 },
      { date: "2026-07-27", close: 103 },
      { date: "2026-08-26", close: 110 },
    ];
    expect(filterPricePoints(points, "custom", { from: "2026-07-26" }).map((point) => point.date))
      .toEqual(["2026-07-27", "2026-08-26"]);
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
