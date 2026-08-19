import { describe, expect, it } from "vitest";
import { formatPct, formatValue, pctChange } from "@/lib/format";

describe("formatValue", () => {
  it("escala a millones con separador de miles español", () => {
    expect(formatValue(383_285_000_000, "USD")).toBe("383.285");
    expect(formatValue(1_234_567_890, "USD")).toBe("1.235");
  });

  it("muestra los negativos entre paréntesis", () => {
    expect(formatValue(-10_959_000_000, "USD")).toBe("(10.959)");
  });

  it("añade decimales cuando el valor escalado es menor que diez", () => {
    expect(formatValue(4_500_000, "USD")).toBe("4,50");
  });

  it("no escala precios por acción y usa dos decimales", () => {
    expect(formatValue(6.13, "USD/shares")).toBe("6,13");
    expect(formatValue(-0.5, "USD/shares")).toBe("(0,50)");
  });

  it("muestra raya ante un dato ausente, nunca un cero", () => {
    expect(formatValue(null, "USD")).toBe("—");
    expect(formatValue(undefined, "USD")).toBe("—");
    expect(formatValue(Number.NaN, "USD")).toBe("—");
    expect(formatValue(0, "USD")).toBe("0");
  });

  it("admite otras escalas", () => {
    // 383,29 escalado supera la decena, así que la regla de decimales no aplica.
    expect(formatValue(383_285_000_000, "USD", "billions")).toBe("383");
    expect(formatValue(4_500_000_000, "USD", "billions")).toBe("4,50");
    expect(formatValue(383_285_000_000, "USD", "thousands")).toBe("383.285.000");
  });
});

describe("pctChange y formatPct", () => {
  it("calcula la variación relativa", () => {
    expect(pctChange(110, 100)).toBeCloseTo(10);
    expect(pctChange(90, 100)).toBeCloseTo(-10);
  });

  it("devuelve null cuando no es calculable", () => {
    expect(pctChange(110, null)).toBeNull();
    expect(pctChange(null, 100)).toBeNull();
    expect(pctChange(110, 0)).toBeNull();
  });

  it("formatea con signo explícito", () => {
    expect(formatPct(10)).toBe("+10,0 %");
    expect(formatPct(-3.25)).toBe("−3,3 %");
    expect(formatPct(null)).toBe("—");
  });
});
