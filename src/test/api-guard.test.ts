import { describe, expect, it } from "vitest";
import { boundedText, rateLimit, validateCik, validateTicker } from "@/lib/api/guard";

describe("protecciones de API", () => {
  it("valida CIK sin aceptar texto ni valores vacíos", () => {
    expect(validateCik("0000320193")).toBe("0000320193");
    expect(validateCik("abc320193")).toBeNull();
    expect(validateCik("0")).toBeNull();
  });

  it("normaliza tickers y rechaza caracteres de ruta", () => {
    expect(validateTicker(" brk.b ")).toBe("BRK.B");
    expect(validateTicker("../secret")).toBeNull();
  });

  it("limita y limpia texto controlado por el usuario", () => {
    expect(boundedText("  ACME\nCorp  ", 20)).toBe("ACME Corp");
    expect(boundedText("123456", 4)).toBe("1234");
  });

  it("devuelve 429 al superar el límite", () => {
    const request = new Request("https://altius.test/api", { headers: { "x-real-ip": "test-rate" } });
    expect(rateLimit(request, "test", 1, 60_000)).toBeNull();
    expect(rateLimit(request, "test", 1, 60_000)?.status).toBe(429);
  });
});
