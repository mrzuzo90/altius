import { describe, expect, it } from "vitest";
import {
  translateToEnglish,
  t,
  FINANCIAL_DICTIONARY,
  DYNAMIC_PATTERNS,
} from "@/lib/i18n/translations";

describe("i18n financial translations", () => {
  it("traduce las principales secciones y estados financieros a terminología Wall Street estándar", () => {
    expect(t("Cuenta de resultados", "en")).toBe("Income Statement");
    expect(t("Balance de situación", "en")).toBe("Balance Sheet");
    expect(t("Flujo de caja libre", "en")).toBe("Free Cash Flow (FCF)");
    expect(t("Las seis claves", "en")).toBe("The 6 Quality Keys");
    expect(t("Cotización histórica", "en")).toBe("Stock Price History");
    expect(t("Evolución histórica agregada", "en")).toBe("Historical Financial Trends");
  });

  it("mantiene el texto original en español cuando lang es 'es'", () => {
    expect(t("Cuenta de resultados", "es")).toBe("Cuenta de resultados");
    expect(t("Las seis claves", "es")).toBe("Las seis claves");
    expect(t("Ingresos", "es")).toBe("Ingresos");
  });

  it("traduce partidas clave de la cuenta de resultados con vocabulario profesional", () => {
    expect(translateToEnglish("Ingresos")).toBe("Revenue");
    expect(translateToEnglish("Coste de ventas")).toBe("Cost of Goods Sold (COGS)");
    expect(translateToEnglish("Beneficio bruto")).toBe("Gross Profit");
    expect(translateToEnglish("Investigación y desarrollo")).toBe("Research & Development (R&D)");
    expect(translateToEnglish("Gastos generales, comerciales y administrativos")).toBe("Selling, General & Administrative (SG&A)");
    expect(translateToEnglish("Resultado de explotación")).toBe("Operating Income (EBIT)");
    expect(translateToEnglish("Resultado antes de impuestos")).toBe("Pretax Income (EBT)");
    expect(translateToEnglish("Resultado neto")).toBe("Net Income");
    expect(translateToEnglish("BPA diluido")).toBe("Diluted EPS");
  });

  it("traduce partidas del balance y del flujo de caja", () => {
    expect(translateToEnglish("Efectivo y equivalentes")).toBe("Cash & Cash Equivalents");
    expect(translateToEnglish("Inmovilizado material neto")).toBe("Net Property, Plant & Equipment (PP&E)");
    expect(translateToEnglish("Deuda financiera neta")).toBe("Net Debt");
    expect(translateToEnglish("Patrimonio neto total")).toBe("Total Stockholders' Equity");
    expect(translateToEnglish("Flujo de caja de explotación")).toBe("Cash Flow from Operations (CFO)");
    expect(translateToEnglish("Inversión en inmovilizado")).toBe("Capital Expenditures (CapEx)");
  });

  it("traduce las 6 claves y sus criterios cuantitativos", () => {
    expect(translateToEnglish("Crecimiento duradero")).toBe("Durable Growth");
    expect(translateToEnglish("Rentabilidad del capital")).toBe("Capital Efficiency (ROIC)");
    expect(translateToEnglish("Beneficio convertido en caja")).toBe("Cash Conversion");
    expect(translateToEnglish("Balance resistente")).toBe("Balance Sheet Health");
    expect(translateToEnglish("Disciplina por acción")).toBe("Per-Share Discipline");
    expect(translateToEnglish("Precio con margen")).toBe("Valuation Multiple");

    expect(translateToEnglish("Ingresos y beneficio ≥ 5 % CAGR")).toBe("Revenue & Earnings ≥ 5% CAGR");
    expect(translateToEnglish("ROIC mediano ≥ 12 %")).toBe("Median ROIC ≥ 12%");
    expect(translateToEnglish("CFO/beneficio ≥ 90 % y FCF recurrente")).toBe("CFO/Net Income ≥ 90% & Recurring FCF");
    expect(translateToEnglish("Caja neta o deuda neta ≤ 2x EBITDA")).toBe("Net cash or Net Debt ≤ 2x EBITDA");
    expect(translateToEnglish("Acciones estables o decrecientes")).toBe("Flat or Decreasing Share Count");
    expect(translateToEnglish("PER ≤ su mediana histórica")).toBe("P/E ≤ Historical Median");
  });

  it("traduce patrones dinámicos con números y observaciones del scorecard", () => {
    expect(translateToEnglish("Cobertura 6/6")).toBe("Coverage 6/6");
    expect(translateToEnglish("Cobertura 5/6")).toBe("Coverage 5/6");
    expect(translateToEnglish("5 de 6 claves cumplen el criterio cuantitativo. Las seis claves tienen datos comparables.")).toBe(
      "5 of 6 keys meet the quantitative criteria. All 6 keys have comparable historical data."
    );
    expect(translateToEnglish("4 de 6 claves cumplen el criterio cuantitativo. Falta 1 clave por datos no comparables.")).toBe(
      "4 of 6 keys meet the quantitative criteria. 1 key lacks comparable historical data."
    );
    expect(translateToEnglish("CFO/beneficio 118 % · FCF positivo 5/5")).toBe(
      "CFO/Net Income 118% · Positive FCF 5/5"
    );
    expect(translateToEnglish("ingresos -1.9 %")).toBe("Revenue -1.9%");
    expect(translateToEnglish("ROIC 9.0 %")).toBe("ROIC 9.0%");
    expect(translateToEnglish("Acciones -0.5 % anual")).toBe("Shares -0.5% annualized");
    expect(translateToEnglish("PER 67.8x · +272 % vs historia")).toBe("P/E 67.8x · +272% vs history");
  });

  it("traduce controles interactivos de Cid y filtros temporales", () => {
    expect(translateToEnglish("Activar Cid")).toBe("Enable Cid");
    expect(translateToEnglish("Desactivar Cid")).toBe("Disable Cid");
    expect(translateToEnglish("Últimos 10 años")).toBe("Last 10 Years");
    expect(translateToEnglish("Últimos 5 años")).toBe("Last 5 Years");
    expect(translateToEnglish("3 años")).toBe("3 Years");
    expect(translateToEnglish("Métricas mostradas")).toBe("Visible Metrics");
    expect(translateToEnglish("Restablecer")).toBe("Reset");
  });

  it("mantiene intactos símbolos bursátiles, números puros y valores desconocidos", () => {
    expect(translateToEnglish("AAPL")).toBe("AAPL");
    expect(translateToEnglish("NOKIA.HE")).toBe("NOKIA.HE");
    expect(translateToEnglish("2498.TW")).toBe("2498.TW");
    expect(translateToEnglish("123,456.78")).toBe("123,456.78");
    expect(translateToEnglish("")).toBe("");
  });
});
