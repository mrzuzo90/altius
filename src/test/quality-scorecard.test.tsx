// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QualityScorecard } from "@/components/quality-scorecard";
import type { QualityScorecardResult } from "@/lib/sec/quality";

afterEach(cleanup);

describe("QualityScorecard", () => {
  const mockScorecard: QualityScorecardResult = {
    score: 3,
    maxScore: 6,
    coverage: 6,
    methodologyLabel: "Metodología Las seis claves",
    items: [
      {
        id: "growth",
        name: "Crecimiento de ventas y BPA",
        category: "Crecimiento",
        status: "pass",
        value: 12.5,
        valueFormatted: "+12,5 % / año",
        threshold: "Crecimiento superior al 5% anual",
        description: "Las ventas y el beneficio por acción han crecido de forma sostenida.",
        whyItMatters: "Verifica que el negocio se expanda con el tiempo.",
      },
      {
        id: "returns",
        name: "Retorno sobre capital (ROIC)",
        category: "Rentabilidad",
        status: "warn",
        value: 9.2,
        valueFormatted: "9,2 %",
        threshold: "ROIC superior al 12%",
        description: "El retorno se encuentra en una zona intermedia que conviene vigilar.",
        whyItMatters: "Mide la eficiencia en el uso del capital.",
      },
      {
        id: "cashQuality",
        name: "Conversión de caja (FCF / Beneficio)",
        category: "Calidad de caja",
        status: "fail",
        value: 45.0,
        valueFormatted: "45,0 %",
        threshold: "FCF >= 80% del beneficio neto",
        description: "El flujo de caja libre no cubre suficientemente el beneficio contable.",
        whyItMatters: "Asegura que los beneficios reportados se traduzcan en dinero real.",
      },
      {
        id: "balance",
        name: "Salud del balance",
        category: "Balance",
        status: "pass",
        value: 1.2,
        valueFormatted: "Deuda neta / EBITDA 1,2x",
        threshold: "Deuda neta / EBITDA < 3x",
        description: "El nivel de apalancamiento es prudente y sostenible.",
        whyItMatters: "Evita riesgos excesivos de insolvencia.",
      },
      {
        id: "perShare",
        name: "Disciplina en acciones en circulación",
        category: "Por acción",
        status: "pass",
        value: -2.1,
        valueFormatted: "−2,1 % acciones",
        threshold: "Acciones estables o decrecientes",
        description: "La empresa recompra acciones sin dilución a los accionistas.",
        whyItMatters: "Protege el valor de cada acción individual.",
      },
      {
        id: "valuation",
        name: "Múltiplos de valoración",
        category: "Valoración",
        status: "unknown",
        value: null,
        valueFormatted: "—",
        threshold: "Múltiplos dentro del rango histórico",
        description: "No hay datos suficientes para contrastar la valoración.",
        whyItMatters: "Permite comprar a precios razonables.",
      },
    ],
  };

  it("sustituye los textos de estado ('PASA', 'VIGILAR', 'NO PASA', 'SIN DATO') por símbolos visuales", () => {
    render(<QualityScorecard scorecard={mockScorecard} />);

    // Verificar que los nombres de texto NO aparecen
    expect(screen.queryByText(/^PASA$/i)).toBeNull();
    expect(screen.queryByText(/^VIGILAR$/i)).toBeNull();
    expect(screen.queryByText(/^NO PASA$/i)).toBeNull();
    expect(screen.queryByText(/^SIN DATO$/i)).toBeNull();

    // Verificar que los símbolos existen con sus títulos accesibles
    const passBadges = screen.getAllByTitle("Cumple el requisito");
    expect(passBadges.length).toBe(3);
    passBadges.forEach((badge) => {
      expect(badge.className).toContain("text-emerald-400");
    });

    const warnBadges = screen.getAllByTitle("En vigilancia");
    expect(warnBadges.length).toBe(1);
    expect(warnBadges[0].className).toContain("text-amber-400");

    const failBadges = screen.getAllByTitle("No cumple el requisito");
    expect(failBadges.length).toBe(1);
    expect(failBadges[0].className).toContain("text-rose-400");

    const unknownBadges = screen.getAllByTitle("Sin dato comparable");
    expect(unknownBadges.length).toBe(1);
  });
});
