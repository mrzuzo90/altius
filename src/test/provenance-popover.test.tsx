// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProvenanceDetail } from "@/components/provenance-popover";

describe("ProvenanceDetail", () => {
  it("muestra el concepto, el formulario y la fecha de un valor reportado", () => {
    render(
      <ProvenanceDetail
        cik="0000320193"
        provenance={{
          kind: "reported",
          concept: "RevenueFromContractWithCustomerExcludingAssessedTax",
          unit: "USD",
          periodStart: "2025-09-28",
          periodEnd: "2026-06-27",
          form: "10-Q",
          filed: "2026-07-31",
          accn: "0000320193-26-000020",
        }}
      />,
    );

    expect(screen.getByText("Dato publicado por la empresa")).toBeDefined();
    expect(
      screen.getByText("RevenueFromContractWithCustomerExcludingAssessedTax"),
    ).toBeDefined();
    expect(screen.getByText(/10-Q/)).toBeDefined();
    expect(screen.getByText("0000320193-26-000020")).toBeDefined();
    const enlace = screen.getByRole("link", { name: /EDGAR/i });
    expect(enlace.getAttribute("href")).toBe(
      "https://www.sec.gov/Archives/edgar/data/320193/000032019326000020/0000320193-26-000020-index.htm",
    );
  });

  it("muestra la fórmula y las entradas de un valor derivado", () => {
    render(
      <ProvenanceDetail
        cik="0000320193"
        provenance={{
          kind: "derived",
          formula: "Flujo de caja de explotación − Inversión en inmovilizado",
          inputs: [
            { label: "Flujo de caja de explotación", value: 118254000000, source: { kind: "absent" } },
            { label: "Inversión en inmovilizado", value: 9447000000, source: { kind: "absent" } },
          ],
        }}
      />,
    );

    expect(screen.getByText("Calculado por Altius")).toBeDefined();
    expect(
      screen.getByText("Flujo de caja de explotación − Inversión en inmovilizado"),
    ).toBeDefined();
    expect(screen.getByText("Inversión en inmovilizado")).toBeDefined();
  });

  it("deja abrir la procedencia propia de cada entrada de un valor derivado", () => {
    render(
      <ProvenanceDetail
        cik="0000320193"
        provenance={{
          kind: "derived",
          formula: "Flujo de caja de explotación − Inversión en inmovilizado",
          inputs: [
            {
              label: "Flujo de caja de explotación",
              value: 118254000000,
              source: {
                kind: "reported",
                concept: "NetCashProvidedByUsedInOperatingActivities",
                unit: "USD",
                periodStart: "2025-09-28",
                periodEnd: "2026-09-27",
                form: "10-K",
                filed: "2026-10-31",
                accn: "0000320193-26-000090",
              },
            },
            { label: "Inversión en inmovilizado", value: 9447000000, source: { kind: "absent" } },
          ],
        }}
      />,
    );

    // La entrada con fuente reportada expone su propio disparador clicable.
    const disparadores = screen.getAllByRole("button", {
      name: "¿De dónde sale este número?",
    });
    expect(disparadores).toHaveLength(1);

    fireEvent.click(disparadores[0]);

    expect(
      screen.getByText("NetCashProvidedByUsedInOperatingActivities"),
    ).toBeDefined();
    expect(screen.getByText("0000320193-26-000090")).toBeDefined();
  });

  it("dice explícitamente que no hay dato cuando la empresa no lo reporta", () => {
    render(<ProvenanceDetail cik="0000320193" provenance={{ kind: "absent" }} />);
    expect(
      screen.getByText("La empresa no reporta este concepto en este periodo."),
    ).toBeDefined();
  });
});
