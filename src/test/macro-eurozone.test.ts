import { describe, expect, it } from "vitest";
import {
  parseEurostatUnemploymentJson,
  parseFredCsv,
  yoyChange,
} from "@/lib/fred/client";
import { MACRO_METRICS, MACRO_SERIES_IDS } from "@/lib/macro/metrics";
import { calculateMacroAnnualTrend } from "@/components/macro-series-dialog";

describe("Macroeconomía Eurozona y Métrica Altius", () => {
  describe("Configuración de métricas macroeconómicas", () => {
    it("contiene los indicadores requeridos de Eurozona y Estados Unidos", () => {
      expect(MACRO_SERIES_IDS).toContain("CP0000EZ19M086NEST");
      expect(MACRO_SERIES_IDS).toContain("ECBMRRFR");
      expect(MACRO_SERIES_IDS).toContain("EZ_UNRATE");
      expect(MACRO_SERIES_IDS).toContain("CPIAUCSL");
      expect(MACRO_SERIES_IDS).toContain("FEDFUNDS");
      expect(MACRO_SERIES_IDS).toContain("UNRATE");
    });

    it("incluye explicaciones didácticas de 3 pilares para cada métrica", () => {
      for (const id of MACRO_SERIES_IDS) {
        const metric = MACRO_METRICS[id];
        expect(metric).toBeDefined();
        expect(metric.education.concept.length).toBeGreaterThan(20);
        expect(metric.education.dailyLife.length).toBeGreaterThan(20);
        expect(metric.education.investing.length).toBeGreaterThan(20);
        expect(["eurozone", "us"]).toContain(metric.region);
      }
    });

    it("clasifica correctamente las 3 métricas de la Eurozona", () => {
      const ezCpi = MACRO_METRICS["CP0000EZ19M086NEST"];
      const ezRates = MACRO_METRICS["ECBMRRFR"];
      const ezUnrate = MACRO_METRICS["EZ_UNRATE"];

      expect(ezCpi.region).toBe("eurozone");
      expect(ezCpi.regionFlag).toBe("🇪🇺");
      expect(ezCpi.yoy).toBe(true);

      expect(ezRates.region).toBe("eurozone");
      expect(ezRates.unit).toBe("%");

      expect(ezUnrate.region).toBe("eurozone");
      expect(ezUnrate.source).toContain("Eurostat");
    });
  });

  describe("parseEurostatUnemploymentJson", () => {
    it("extrae observaciones mensuales en formato FredPoint", () => {
      const sampleEurostatJson = {
        dimension: {
          time: {
            category: {
              index: {
                "2024-01": 0,
                "2024-02": 1,
                "2024-03": 2,
              },
            },
          },
        },
        value: {
          0: 6.5,
          1: 6.5,
          2: 6.4,
        },
      };

      const points = parseEurostatUnemploymentJson(sampleEurostatJson);
      expect(points).toEqual([
        { date: "2024-01-01", value: 6.5 },
        { date: "2024-02-01", value: 6.5 },
        { date: "2024-03-01", value: 6.4 },
      ]);
    });

    it("maneja de forma segura respuestas vacías o datos ausentes", () => {
      expect(parseEurostatUnemploymentJson({})).toEqual([]);
      expect(parseEurostatUnemploymentJson({ dimension: {} } as any)).toEqual([]);
      expect(
        parseEurostatUnemploymentJson({
          dimension: { time: { category: { index: { "2024-01": 0, "2024-02": 1 } } } },
          value: { 1: 6.4 }, // 0 falta
        }),
      ).toEqual([{ date: "2024-02-01", value: 6.4 }]);
    });
  });

  describe("Cálculo de rendimiento anual con Cid en macroeconomía", () => {
    it("calcula la variación anualizada y asigna la postura adecuada de Cid", () => {
      // 5 años de inflación moderada creciendo a un ~2.5% anual
      const points = [
        { date: "2020-01-01", value: 100 },
        { date: "2025-01-01", value: 113.14 }, // ~2.5% CAGR
      ];

      const trend = calculateMacroAnnualTrend(points, 1.0);
      expect(trend).not.toBeNull();
      expect(trend!.rate).toBeCloseTo(2.5, 1);
      expect(trend!.phase).toBe("senor"); // -5% a +5%
      expect(trend!.mascot.src).toBe("/cid/senor.svg");
    });

    it("asigna Cid caballero para crecimientos moderados (+5% a +15%)", () => {
      const points = [
        { date: "2022-01-01", value: 100 },
        { date: "2024-01-01", value: 116.64 }, // ~8% CAGR
      ];

      const trend = calculateMacroAnnualTrend(points, 1.0);
      expect(trend).not.toBeNull();
      expect(trend!.rate).toBeCloseTo(8.0, 1);
      expect(trend!.phase).toBe("caballero");
      expect(trend!.mascot.src).toBe("/cid/caballero.svg");
    });

    it("asigna Cid cañón o cuerda para subidas fuertes", () => {
      const points = [
        { date: "2022-01-01", value: 1.0 },
        { date: "2024-01-01", value: 1.44 }, // +20% anual
      ];

      const trend = calculateMacroAnnualTrend(points, 1.0);
      expect(trend).not.toBeNull();
      expect(trend!.rate).toBeCloseTo(20.0, 1);
      expect(trend!.phase).toBe("cuerda");
      expect(trend!.mascot.src).toBe("/cid/cuerda.svg");
    });

    it("asigna Cid flecha o apuñalado para caídas severas", () => {
      const points = [
        { date: "2022-01-01", value: 100 },
        { date: "2024-01-01", value: 49 }, // -30% anual
      ];

      const trend = calculateMacroAnnualTrend(points, 1.0);
      expect(trend).not.toBeNull();
      expect(trend!.phase).toBe("apunalado");
      expect(trend!.mascot.src).toBe("/cid/apunalado.svg");
    });

    it("retorna null si los puntos son insuficientes en tiempo", () => {
      const points = [
        { date: "2024-01-01", value: 10 },
        { date: "2024-01-15", value: 12 },
      ];
      expect(calculateMacroAnnualTrend(points, 1.0)).toBeNull();
    });
  });
});
