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
      tickers: ["TSLA"],
      sector: "Automotive",
      sic: "3711",
      sicDescription: "Motor Vehicles",
      stateOfIncorporation: "DE",
      fiscalYearEnd: "1231",
      exchanges: ["NASDAQ"],
      website: null,
      address: null,
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
            line: { id: "revenue", label: "Ingresos", kind: "duration", unit: "USD", concepts: ["Revenues"] },
            cells: {
              FY2022: { value: 81462000000, derived: false, provenance: { kind: "reported", concept: "Revenues", unit: "USD", periodStart: "2022-01-01", periodEnd: "2022-12-31", form: "10-K", filed: "2023-01-30", accn: "0001" } },
              FY2023: { value: 96773000000, derived: false, provenance: { kind: "reported", concept: "Revenues", unit: "USD", periodStart: "2023-01-01", periodEnd: "2023-12-31", form: "10-K", filed: "2024-01-29", accn: "0002" } },
              FY2024: { value: 97690000000, derived: false, provenance: { kind: "reported", concept: "Revenues", unit: "USD", periodStart: "2024-01-01", periodEnd: "2024-12-31", form: "10-K", filed: "2025-01-30", accn: "0003" } },
            },
          },
          {
            line: { id: "netIncome", label: "Beneficio neto", kind: "duration", unit: "USD", concepts: ["NetIncomeLoss"] },
            cells: {
              FY2022: { value: 12583000000, derived: false, provenance: { kind: "reported", concept: "NetIncomeLoss", unit: "USD", periodStart: "2022-01-01", periodEnd: "2022-12-31", form: "10-K", filed: "2023-01-30", accn: "0001" } },
              FY2023: { value: 14997000000, derived: false, provenance: { kind: "reported", concept: "NetIncomeLoss", unit: "USD", periodStart: "2023-01-01", periodEnd: "2023-12-31", form: "10-K", filed: "2024-01-29", accn: "0002" } },
              FY2024: { value: 7088000000, derived: false, provenance: { kind: "reported", concept: "NetIncomeLoss", unit: "USD", periodStart: "2024-01-01", periodEnd: "2024-12-31", form: "10-K", filed: "2025-01-30", accn: "0003" } },
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

  it("ordena los periodos cronológicamente de menor a mayor (primeros años a la izquierda, últimos a la derecha)", () => {
    // Bundle con periodos en orden inverso (más recientes primero, como viene de la SEC)
    const reversedBundle: StatementBundle = {
      ...mockBundle,
      blocks: [
        {
          ...mockBundle.blocks[0],
          periods: [
            { key: "FY2024", label: "2024", end: "2024-12-31", fiscalYear: 2024, quarter: 0, derived: false },
            { key: "FY2023", label: "2023", end: "2023-12-31", fiscalYear: 2023, quarter: 0, derived: false },
            { key: "FY2022", label: "2022", end: "2022-12-31", fiscalYear: 2022, quarter: 0, derived: false },
          ],
        },
      ],
    };

    render(
      <FinancialOverviewChart
        bundle={reversedBundle}
        ticker="TSLA"
        frequency="annual"
      />
    );

    // El rango temporal debe ser estrictamente de menor a mayor (2022 - 2024)
    expect(screen.getByText(/Evolución Financiera Histórica \(2022 - 2024\)/i)).toBeDefined();
  });

  it("permite activar y desactivar a Cid mediante el botón superior", () => {
    render(
      <FinancialOverviewChart
        bundle={mockBundle}
        ticker="TSLA"
        frequency="annual"
      />
    );

    // Inicialmente Cid está activado
    const cidToggleBtn = screen.getByRole("button", { name: /Desactivar Cid en el gráfico/i });
    expect(cidToggleBtn).toBeDefined();
    expect(screen.getByText(/Cid: Activado/i)).toBeDefined();
    expect(screen.getByText(/Cid evalúa:/i)).toBeDefined();

    // Al hacer clic, se desactiva
    fireEvent.click(cidToggleBtn);
    expect(screen.getByText(/Cid: Desactivado/i)).toBeDefined();
    expect(screen.queryByText(/Cid evalúa:/i)).toBeNull();

    // Al volver a hacer clic, se vuelve a activar
    const reenableBtn = screen.getByRole("button", { name: /Activar Cid en el gráfico/i });
    fireEvent.click(reenableBtn);
    expect(screen.getByText(/Cid: Activado/i)).toBeDefined();
    expect(screen.getByText(/Cid evalúa:/i)).toBeDefined();
  });

  it("ofrece selector de horizonte temporal con 10A por defecto y cálculo de crecimiento", () => {
    render(
      <FinancialOverviewChart
        bundle={mockBundle}
        ticker="TSLA"
        frequency="annual"
      />
    );

    // Botones de horizonte temporal: 3A, 5A, 10A, Todo
    const btn10A = screen.getByRole("button", { name: "10A" });
    const btn3A = screen.getByRole("button", { name: "3A" });
    const btn5A = screen.getByRole("button", { name: "5A" });
    const btnTodo = screen.getByRole("button", { name: "Todo" });

    expect(btn10A).toBeDefined();
    expect(btn3A).toBeDefined();
    expect(btn5A).toBeDefined();
    expect(btnTodo).toBeDefined();

    // 10A está seleccionado por defecto (clase bg-periwinkle-glow)
    expect(btn10A.className).toContain("bg-periwinkle-glow");

    // Muestra el crecimiento en el periodo seleccionado
    expect(screen.getByText(/Crecimiento \(2 años\):/i)).toBeDefined();
    expect(screen.getByText(/Ingresos \+19\.9%/i)).toBeDefined();

    // Al pulsar 3A
    fireEvent.click(btn3A);
    expect(btn3A.className).toContain("bg-periwinkle-glow");
  });

  it("ofrece selector de escala con Miles, Millones y Miles M, y actualiza la unidad", () => {
    const handleScaleChange = vi.fn();
    render(
      <FinancialOverviewChart
        bundle={mockBundle}
        ticker="TSLA"
        frequency="annual"
        scale="millions"
        onScaleChange={handleScaleChange}
      />
    );

    // Botones de escala
    const btnMiles = screen.getByRole("button", { name: "Miles" });
    const btnMillones = screen.getByRole("button", { name: "Millones" });
    const btnMilesM = screen.getByRole("button", { name: "Miles M" });

    expect(btnMiles).toBeDefined();
    expect(btnMillones).toBeDefined();
    expect(btnMilesM).toBeDefined();

    // Millones está activo
    expect(btnMillones.className).toContain("bg-periwinkle-glow");
    expect(screen.getByText(/Escala:/i)).toBeDefined();
    expect(screen.getByText(/Millones \(\$ USD\)/i)).toBeDefined();

    // Al pulsar Miles M
    fireEvent.click(btnMilesM);
    expect(handleScaleChange).toHaveBeenCalledWith("billions");
  });
});
