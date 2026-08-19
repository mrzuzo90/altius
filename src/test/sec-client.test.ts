import { describe, expect, it } from "vitest";
import { padCik, trimCik } from "@/lib/sec/client";

describe("normalización de CIK", () => {
  it("rellena a diez dígitos para las rutas del API", () => {
    expect(padCik(320193)).toBe("0000320193");
    expect(padCik("320193")).toBe("0000320193");
    expect(padCik("CIK0000320193")).toBe("0000320193");
    expect(padCik("0000320193")).toBe("0000320193");
  });

  it("elimina los ceros a la izquierda para las rutas de Archives", () => {
    expect(trimCik("0000320193")).toBe("320193");
    expect(trimCik(320193)).toBe("320193");
    expect(trimCik("0001318605")).toBe("1318605");
  });
});
