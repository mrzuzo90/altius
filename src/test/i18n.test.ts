// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { t, translateToEnglish, FINANCIAL_DICTIONARY } from "@/lib/i18n/translations";
import { domTranslator } from "@/lib/i18n/dom-translator";

describe("i18n plain-English translation engine", () => {
  afterEach(() => {
    domTranslator.applyLanguage("es");
    document.body.innerHTML = "";
    document.title = "";
  });

  it("returns original Spanish text untouched when lang is es", () => {
    expect(t("Crecimiento duradero", "es")).toBe("Crecimiento duradero");
    expect(t("El negocio en 30 segundos", "es")).toBe("El negocio en 30 segundos");
  });

  it("uses approachable, plain-English financial phrasing instead of literal translations", () => {
    expect(t("La terminal fundamental de Wall Street sin ruido.", "en")).toBe(
      "Wall Street fundamentals, without the noise."
    );
    expect(t("Las seis claves", "en")).toBe("The 6 Keys");
    expect(t("Crecimiento duradero", "en")).toBe("Steady Growth");
    expect(t("Rentabilidad del capital", "en")).toBe("Return on Capital");
    expect(t("Beneficio convertido en caja", "en")).toBe("Real Cash Flow");
    expect(t("Balance resistente", "en")).toBe("Solid Balance Sheet");
    expect(t("Disciplina por acción", "en")).toBe("Shareholder Discipline");
    expect(t("Precio con margen", "en")).toBe("Fair Valuation");
    expect(t("El negocio en 30 segundos", "en")).toBe("30-Second Snapshot");
    expect(t("PER (FY)", "en")).toBe("P/E (FY)");
  });

  it("covers Personal Budget, Compound Interest, Inflation, Macro, Indices, Commodities, Forex, and Watchlist", () => {
    expect(t("Presupuesto", "en")).toBe("Budget");
    expect(t("Materias Primas", "en")).toBe("Commodities");
    expect(t("Divisas", "en")).toBe("Currencies");
    expect(t("Favoritas", "en")).toBe("Watchlist");
    expect(t("Pulso Macroeconómico y de Mercado", "en")).toBe("Market & Economy Pulse");
    expect(t("Inflación IPC (YoY)", "en")).toBe("US Inflation (CPI YoY)");
    expect(t("Tipo de la Fed", "en")).toBe("Fed Interest Rate");
    expect(t("Desempleo EE. UU.", "en")).toBe("US Unemployment");
    expect(t("Análisis técnico", "en")).toBe("Technicals");
    expect(t("Copiloto", "en")).toBe("AI Copilot");
    expect(t("Cuenta de resultados", "en")).toBe("Income Statement");
    expect(t("Balance de situación", "en")).toBe("Balance Sheet");
    expect(t("Flujo de caja", "en")).toBe("Cash Flow");
  });

  it("translates JSX-split text fragments created around dynamic expressions", () => {
    expect(translateToEnglish("Crecimiento (")).toBe("Growth (");
    expect(translateToEnglish(" años): ")).toBe(" yrs): ");
    expect(translateToEnglish("%/año)")).toBe("%/yr)");
    expect(translateToEnglish("· Beneficio")).toBe("· Net income");
    expect(translateToEnglish("Todos (")).toBe("All (");
    expect(translateToEnglish("Prensa (")).toBe("Press (");
  });

  it("translates middle-dot compound strings cleanly", () => {
    expect(translateToEnglish("Estados Unidos · USD")).toBe("United States · USD");
    expect(translateToEnglish("Manufactura · Electronic Computers")).toBe(
      "Manufacturing · Electronic Computers"
    );
    expect(translateToEnglish("PASA · Balance resistente")).toBe(
      "PASS · Solid Balance Sheet"
    );
  });

  it("handles case-insensitive lookups while preserving ALL CAPS labels", () => {
    expect(translateToEnglish("observatorio")).toBe("Overview");
    expect(translateToEnglish("VIGILAR")).toBe("WATCH");
    expect(translateToEnglish("NO PASA")).toBe("FAIL");
  });

  it("translates dynamic scorecard, business snapshot, chart, budget, macro, and date strings", () => {
    expect(translateToEnglish("Cobertura 6/6")).toBe("Coverage 6/6");
    expect(
      translateToEnglish("4 de 6 claves cumplen el criterio cuantitativo")
    ).toBe("4 of 6 keys meet the benchmark");
    expect(
      translateToEnglish("Faltan 2 claves por falta de datos comparables.")
    ).toBe("2 keys are missing comparable data.");
    expect(translateToEnglish("PER 24.5x · +12.0% vs historia")).toBe(
      "P/E 24.5x · +12.0% vs. history"
    );
    expect(
      translateToEnglish("Evolución Financiera Histórica (2016 - 2025)")
    ).toBe("Historical Financial Trend (2016 - 2025)");
    expect(
      translateToEnglish("Cid recorre la trayectoria financiera agregada de AAPL")
    ).toBe("Cid is walking through AAPL's overall financial track record");
    expect(
      translateToEnglish("Integrar Ingresos en el gráfico superior")
    ).toBe("Add revenue to the main chart");
    expect(translateToEnglish("Presentado el 14 de noviembre de 2026")).toBe(
      "Filed Nov 14, 2026"
    );
    expect(translateToEnglish("14 nov 2026")).toBe("Nov 14, 2026");
    expect(
      translateToEnglish("Capital Final Proyectado tras 15 años")
    ).toBe("Projected Balance After 15 Years");
    expect(
      translateToEnglish("50% asignado · Resta un 500 € por asignar")
    ).toBe("50% allocated · 500 € left to assign");
    expect(
      translateToEnglish("Diseña dispositivos móviles, software y servicios conectados.")
    ).toBe("Designs mobile devices, software, and connected services.");
    expect(
      translateToEnglish("El segmento más grande es Services (28%).")
    ).toBe("Largest segment: Services (28%).");
    expect(translateToEnglish("Todos (12)")).toBe("All (12)");
    expect(translateToEnglish("98 contratos analizados")).toBe("98 contracts analyzed");
  });

  it("has comprehensive dictionary coverage across all modules", () => {
    expect(Object.keys(FINANCIAL_DICTIONARY).length).toBeGreaterThan(700);
  });
});

describe("DomTranslator live DOM & SVG support", () => {
  afterEach(() => {
    domTranslator.applyLanguage("es");
    document.body.innerHTML = "";
    document.title = "";
  });

  it("translates SVG <text>/<tspan> chart labels, attributes, and document.title, then restores Spanish", () => {
    document.title = "Índices Bursátiles Mundiales y Europeos | Altius";
    document.body.innerHTML = `
      <main>
        <h1>El negocio en 30 segundos</h1>
        <button id="cid-btn" title="Ocultar a Cid en el gráfico de Ingresos" aria-label="Cid: Activado">Cid: Activado</button>
        <svg viewBox="0 0 100 100">
          <text><tspan id="svg-label">Cobertura 6/6</tspan></text>
        </svg>
      </main>
    `;

    domTranslator.applyLanguage("en");

    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toBe("Global & European Stock Indices | Altius");
    expect(document.querySelector("h1")?.textContent).toBe("30-Second Snapshot");
    expect(document.getElementById("cid-btn")?.textContent).toBe("Cid: On");
    expect(document.getElementById("cid-btn")?.getAttribute("aria-label")).toBe("Cid: On");
    expect(document.getElementById("cid-btn")?.getAttribute("title")).toBe(
      "Hide Cid on the revenue chart"
    );
    expect(document.getElementById("svg-label")?.textContent).toBe("Coverage 6/6");

    // Restoring to Spanish reverts DOM nodes, attributes, and document.title cleanly
    domTranslator.applyLanguage("es");

    expect(document.documentElement.lang).toBe("es");
    expect(document.title).toBe("Índices Bursátiles Mundiales y Europeos | Altius");
    expect(document.querySelector("h1")?.textContent).toBe("El negocio en 30 segundos");
    expect(document.getElementById("cid-btn")?.textContent).toBe("Cid: Activado");
    expect(document.getElementById("cid-btn")?.getAttribute("title")).toBe(
      "Ocultar a Cid en el gráfico de Ingresos"
    );
    expect(document.getElementById("svg-label")?.textContent).toBe("Cobertura 6/6");
  });

  it("re-translates when React updates text or attributes on previously translated nodes", async () => {
    document.body.innerHTML = `
      <button id="toggle-cid" aria-label="Cid: Activado">Cid: Activado</button>
    `;

    domTranslator.applyLanguage("en");
    const btn = document.getElementById("toggle-cid") as HTMLButtonElement;
    expect(btn.textContent).toBe("Cid: On");

    // Simulate React mutating the same text node & attribute
    btn.firstChild!.nodeValue = "Cid: Desactivado";
    btn.setAttribute("aria-label", "Cid: Desactivado");

    // Wait a microtask tick for MutationObserver to fire
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(btn.textContent).toBe("Cid: Off");
    expect(btn.getAttribute("aria-label")).toBe("Cid: Off");
  });
});
