// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { FinancialOverviewChart } from "@/components/financial-overview-chart";
import type { StatementBundle } from "@/lib/sec/statements";

afterEach(cleanup);

vi.mock("recharts", async (importOriginal) => {
  const original = await importOriginal<typeof import("recharts")>();
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div style={{ width: 800, height: 400 }}>{children}</div>,
  };
});

describe("FinancialOverviewChart", () => {
  const mockBundle: StatementBundle = {
    profile: {
      cik: "0001318605",
      name: "Tesla, Inc.",
      ticker: "TSLA",
      sector: "Automotive",
      sic: "3711",
      sicDescription: "Motor Vehicles",
      stateOfIncorporation: "DE",
      fiscalYearEnd: "1231",
      exchanges: ["NASDAQ"],
    },
    frequency: "annual",
    currency: "USD",
    latestPeriodEnd: "2024-12-31",
    blocks: [
      {
        id: "income",
        label: "Cuenta de resultados",
        periods: [
          { key: "FY2022", label: "2022", end: "2022-12-31", fiscalYear: 2022, quarter: 0, derived: false },
          { key: "FY2023", label: "2023", end: "2023-12-31", fiscalYear: 2023, quarter: 0, derived: false },
          { key: "FY2024", label: "2024", end: "2024-12-31", fiscalYear: 2024, quarter: 0, derived: false },
        ],
        rows: [
          {
            line: { id: "revenue", label: "Ingresos", unit: "USD" },
            cells: {
              FY2022: { value: 81462000000, derived: false, provenance: { kind: "sec-facts", factId: 1, form: "10-K", filed: "2023-01-30", periodEnd: "2022-12-31", concept: "Revenues" } },
              FY2023: { value: 96773000000, derived: false, provenance: { kind: "sec-facts", factId: 2, form: "10-K", filed: "2024-01-29", periodEnd: "2023-12-31", concept: "Revenues" } },
              FY2024: { value: 97690000000, derived: false, provenance: { kind: "sec-facts", factId: 3, form: "10-K", filed: "2025-01-30", periodEnd: "2024-12-31", concept: "Revenues" } },
            },
          },
          {
            line: { id: "netIncome", label: "Beneficio neto", unit: "USD" },
            cells: {
              FY2022: { value: 12583000000, derived: false, provenance: { kind: "sec-facts", factId: 4, form: "10-K", filed: "2023-01-30", periodEnd: "2022-12-31", concept: "NetIncomeLoss" } },
              FY2023: { value: 14997000000, derived: false, provenance: { kind: "sec-facts", factId: 5, form: "10-K", filed: "2024-01-29", periodEnd: "2023-12-31", concept: "NetIncomeLoss" } },
              FY2024: { value: 7088000000, derived: false, provenance: { kind: "sec-facts", factId: 6, form: "10-K", filed: "2025-01-30", periodEnd: "2024-12-31", concept: "NetIncomeLoss" } },
            },
          },
        ],
      },
    ],
  };

  it("renderiza la cabecera con el título histórico y a Cid", () => {
    render(
      <FinancialOverviewChart
        bundle={mockBundle}
        ticker="TSLA"
        frequency="annual"
      />
    );

    // Título con rango temporal
    expect(screen.getByText(/Evolución Financiera Histórica \(2022 - 2024\)/i)).toBeDefined();

    // Presencia de Cid y su veredicto
    expect(screen.getByText(/Cid evalúa:/i)).toBeDefined();
    expect(screen.getByAltText(/Cid/i)).toBeDefined();

    // Píldoras de métricas interactivas
    expect(screen.getByRole("button", { name: /Ingresos/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Beneficio Neto/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Margen Neto/i })).toBeDefined();
  });

  it("permite conmutar la visibilidad de métricas interactivamente", () => {
    render(
      <FinancialOverviewChart
        bundle={mockBundle}
        ticker="TSLA"
        frequency="annual"
      />
    );

    const fcfButton = screen.getByRole("button", { name: /FCF/i });
    expect(fcfButton).toBeDefined();

    // Al pulsar FCF, se activa en las métricas
    fireEvent.click(fcfButton);
    expect(fcfButton.className).toContain("text-pure-white");
  });
});
