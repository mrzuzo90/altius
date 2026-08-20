import { describe, expect, it } from "vitest";
import { extractiveSummary, textoDeRespuesta } from "@/lib/ai/gemini";

describe("textoDeRespuesta", () => {
  it("extrae el texto de una respuesta normal", () => {
    expect(textoDeRespuesta({ candidates: [{ content: { parts: [{ text: '{"a":1}' }] } }] })).toBe(
      '{"a":1}',
    );
  });

  it("ignora las partes de razonamiento y conserva la respuesta", () => {
    // Los modelos con razonamiento pueden anteponer su cadena de pensamiento.
    // Coger parts[0] a ciegas devolvería texto que no es el JSON pedido.
    const r = textoDeRespuesta({
      candidates: [
        {
          content: {
            parts: [
              { text: "Primero analizo el informe…", thought: true },
              { text: '{"drivers":[]}' },
            ],
          },
        },
      ],
    });
    expect(r).toBe('{"drivers":[]}');
  });

  it("concatena varias partes de respuesta", () => {
    expect(
      textoDeRespuesta({
        candidates: [{ content: { parts: [{ text: '{"a"' }, { text: ":1}" }] } }],
      }),
    ).toBe('{"a":1}');
  });

  it("devuelve null si no hay contenido utilizable", () => {
    expect(textoDeRespuesta({})).toBeNull();
    expect(textoDeRespuesta({ candidates: [{ content: { parts: [] } }] })).toBeNull();
    expect(
      textoDeRespuesta({ candidates: [{ content: { parts: [{ text: "  " }] } }] }),
    ).toBeNull();
  });
});

describe("extractiveSummary", () => {
  const texto = [
    "Net sales increased during 2025 driven primarily by higher demand for services and iPhone across all reportable segments of the business.",
    "The Company faces risk from adverse macroeconomic conditions and increased competition in several of its most important markets worldwide.",
    "Corto.",
  ].join(" ");

  it("selecciona frases literales del informe y marca la fuente", () => {
    const r = extractiveSummary(texto, "sin clave");
    expect(r.source).toBe("extractive");
    expect(r.notice).toBe("sin clave");
    expect(r.drivers.length).toBeGreaterThan(0);
    expect(texto).toContain(r.drivers[0]);
  });

  it("no valora el tono cuando no hay modelo detrás", () => {
    expect(extractiveSummary(texto, "x").tone).toContain("Sin clave de Gemini");
  });
});
