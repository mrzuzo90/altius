import { SYSTEM_MDNA, userPromptMdna } from "./prompts";

export type MdnaBody = {
  drivers: string[];
  risks: string[];
  tone: string;
  /** `gemini` si lo ha redactado el modelo; `extractive` si es un recorte literal. */
  source: "gemini" | "extractive";
  /** Motivo de la degradación, cuando la hay. Se muestra al usuario. */
  notice?: string;
};

const MODELO = "gemini-2.5-pro";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`;

/**
 * Esquema de respuesta. Gemini admite un subconjunto de OpenAPI y devuelve JSON
 * conforme, lo que evita tener que parsear prosa.
 */
const SCHEMA = {
  type: "OBJECT",
  properties: {
    drivers: { type: "ARRAY", items: { type: "STRING" } },
    risks: { type: "ARRAY", items: { type: "STRING" } },
    tone: { type: "STRING" },
  },
  required: ["drivers", "risks", "tone"],
};

/**
 * Resumen extractivo determinista.
 *
 * No genera lenguaje: selecciona frases literales del propio informe. Es el
 * comportamiento por defecto sin clave, y garantiza que nunca se muestre texto
 * inventado presentándolo como análisis.
 */
export function extractiveSummary(texto: string, notice: string): MdnaBody {
  const frases = texto
    .split(/(?<=[.!?])\s+(?=[A-Z“"])/)
    .map((f) => f.replace(/\s+/g, " ").trim())
    .filter((f) => f.length > 80 && f.length < 400);

  const buscar = (claves: RegExp, n: number) =>
    frases.filter((f) => claves.test(f)).slice(0, n);

  return {
    drivers: buscar(
      /\b(revenue|sales|growth|increase[sd]?|driven (by|primarily)|demand|net sales)\b/i,
      3,
    ),
    risks: buscar(
      /\b(risk|adverse|uncertain|decline|competition|disruption|tariff|litigation|volatil)\w*\b/i,
      3,
    ),
    tone: "Sin clave de Gemini no se valora el tono: los puntos anteriores son frases literales del informe, sin interpretación.",
    source: "extractive",
    notice,
  };
}

export async function summarizeMdna(
  texto: string,
  empresa: string,
  periodo: string,
): Promise<MdnaBody> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return extractiveSummary(
      texto,
      "No hay GEMINI_API_KEY configurada. Se muestran frases literales del informe, sin resumir.",
    );
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_MDNA }] },
        contents: [{ role: "user", parts: [{ text: userPromptMdna(empresa, periodo, texto) }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: SCHEMA,
        },
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const detalle = res.status === 429 ? "Cuota de Gemini agotada." : `Gemini devolvió ${res.status}.`;
      return extractiveSummary(texto, `${detalle} Se muestran frases literales del informe.`);
    }

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const bruto = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!bruto) {
      return extractiveSummary(texto, "Gemini no devolvió contenido. Se muestran frases literales.");
    }

    const parsed = JSON.parse(bruto) as Omit<MdnaBody, "source">;
    return {
      drivers: parsed.drivers ?? [],
      risks: parsed.risks ?? [],
      tone: parsed.tone ?? "",
      source: "gemini",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return extractiveSummary(texto, `Fallo al contactar con Gemini (${msg}). Se muestran frases literales.`);
  }
}
