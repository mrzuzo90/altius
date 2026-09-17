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

  describe("Cálculo realista de métricas anuales con Cid en macroeconomía", () => {
    it("calcula la inflación media anual y asigna Cid señor para inflación controlada (~2%)", () => {
      const cpiMetric = MACRO_METRICS["CP0000EZ19M086NEST"];
      const points = [
        { date: "2024-01-01", value: 2.8 },
        { date: "2024-02-01", value: 2.6 },
        { date: "2024-03-01", value: 2.4 },
        { date: "2024-04-01", value: 2.2 },
      ];

      const trend = calculateMacroAnnualTrend(points, cpiMetric);
      expect(trend).not.toBeNull();
      expect(trend!.rate).toBeCloseTo(2.5, 1);
      expect(trend!.displayValue).toBe("+2,5 %");
      expect(trend!.mascot.src).toBe("/cid/senor.svg");
      // Verifica que no tenga etiquetas o nombres de Cid en la salida
      expect((trend as any).patternName).toBeUndefined();
    });

    it("asigna Cid caballero para inflación moderada (3.5% a 5.5%)", () => {
      const cpiMetric = MACRO_METRICS["CP0000EZ19M086NEST"];
      const points = [
        { date: "2022-01-01", value: 4.5 },
        { date: "2022-06-01", value: 4.8 },
      ];

      const trend = calculateMacroAnnualTrend(points, cpiMetric);
      expect(trend).not.toBeNull();
      expect(trend!.mascot.src).toBe("/cid/caballero.svg");
      expect(trend!.displayValue).toBe("+4,7 %");
    });

    it("calcula tipos de interés del BCE de forma realista sin porcentajes astronómicos", () => {
      const ecbMetric = MACRO_METRICS["ECBMRRFR"];
      const points = [
        { date: "2022-01-01", value: 0.0 },
        { date: "2023-01-01", value: 2.5 },
        { date: "2026-09-01", value: 2.65 },
      ];

      const trend = calculateMacroAnnualTrend(points, ecbMetric);
      expect(trend).not.toBeNull();
      // Debe mostrar el tipo actual (2,65%) y no un disparate como +700%
      expect(trend!.rate).toBe(2.65);
      expect(trend!.displayValue).toBe("2,65 %");
      expect(trend!.mascot.src).toBe("/cid/caballero.svg");
    });

    it("calcula desempleo de forma realista y asigna la figura correcta", () => {
      const unrateMetric = MACRO_METRICS["EZ_UNRATE"];
      const points = [
        { date: "2024-01-01", value: 6.5 },
        { date: "2024-06-01", value: 6.4 },
      ];

      const trend = calculateMacroAnnualTrend(points, unrateMetric);
      expect(trend).not.toBeNull();
      expect(trend!.rate).toBe(6.4);
      expect(trend!.displayValue).toBe("6,4 %");
      expect(trend!.mascot.src).toBe("/cid/senor.svg");
    });

    it("retorna null si los puntos son insuficientes", () => {
      const unrateMetric = MACRO_METRICS["EZ_UNRATE"];
      expect(calculateMacroAnnualTrend([], unrateMetric)).toBeNull();
      expect(calculateMacroAnnualTrend([{ date: "2024-01-01", value: 5 }], unrateMetric)).toBeNull();
    });
  });
});
