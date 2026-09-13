// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PriceChart } from "@/components/price-chart";

// Mock ResponsiveContainer for jsdom
vi.mock("recharts", async (importOriginal) => {
  const original = await importOriginal<typeof import("recharts")>();
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div style={{ width: 800, height: 400 }}>{children}</div>,
  };
});

describe("renderizado del componente PriceChart", () => {
  const mockPoints = [
    { date: "2016-01-01", close: 100 },
    { date: "2018-01-01", close: 150 },
    { date: "2020-01-01", close: 200 },
    { date: "2022-01-01", close: 300 },
    { date: "2024-01-01", close: 400 },
    { date: "2026-01-01", close: 600 },
  ];

  it("renderiza el bloque de CAGR y Cid en la cabecera", () => {
    render(
      <PriceChart
        points={mockPoints}
        source="SEC EDGAR"
        currency="USD"
        ticker="TEST"
      />
    );

    // Debe mostrar CAGR
    expect(screen.getAllByText(/CAGR/i).length).toBeGreaterThan(0);
    // Debe mostrar la figura de Cid
    expect(screen.getAllByAltText(/Cid/i).length).toBeGreaterThan(0);
    // Debe mostrar el botón de toggle de Cid
    expect(screen.getByRole("button", { name: /Ocultar a Cid/i })).toBeDefined();
  });
});
