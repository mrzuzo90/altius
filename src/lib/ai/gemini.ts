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

/**
 * Modelo por defecto.
 *
 * No es un "pro" por una razón concreta y comprobada: en el nivel gratuito del
 * API los modelos pro devuelven 429 con `limit: 0`, es decir, cuota cero. Los
 * `gemini-2.5-*` además responden 404 a las cuentas nuevas. `gemini-3.6-flash`
 * es el que la propia respuesta de error de Google recomienda, tiene ventana de
 * un millón de tokens —de sobra para un MD&A— y sí trae cuota gratuita.
 *
 * Se puede cambiar sin tocar código con la variable GEMINI_MODEL.
 */
const MODELO_POR_DEFECTO = "gemini-3.6-flash";

function endpoint(): string {
  const modelo = process.env.GEMINI_MODEL?.trim() || MODELO_POR_DEFECTO;
  return `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;
}

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

type GeminiPart = { text?: string; thought?: boolean };
type GeminiResponse = { candidates?: { content?: { parts?: GeminiPart[] } }[] };

/**
 * Extrae el texto de la respuesta.
 *
 * Los modelos con razonamiento pueden devolver varias `parts`, y las de
 * pensamiento vienen marcadas con `thought: true`. Coger `parts[0].text` a
 * ciegas funciona hasta que el modelo decide devolver el razonamiento primero,
 * y entonces se intenta parsear como JSON algo que no lo es.
 */
export function textoDeRespuesta(json: GeminiResponse): string | null {
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const util = parts
    .filter((p) => p.thought !== true && typeof p.text === "string")
    .map((p) => p.text!)
    .join("");
  return util.trim() ? util : null;
}

/** Traduce el fallo del API a algo que el usuario pueda accionar. */
async function describirFallo(res: Response): Promise<string> {
  let mensaje = "";
  try {
    const cuerpo = (await res.json()) as { error?: { message?: string } };
    mensaje = cuerpo.error?.message ?? "";
  } catch {
    // Sin cuerpo legible; nos quedamos con el código.
  }

  if (res.status === 429) {
    return "Cuota de Gemini agotada. Se muestran frases literales del informe.";
  }
  if (res.status === 404 && /no longer available/i.test(mensaje)) {
    return (
      "El modelo configurado ya no está disponible para esta cuenta. Ajusta " +
      "GEMINI_MODEL. Mientras tanto se muestran frases literales del informe."
    );
  }
  if (res.status === 400 || res.status === 403) {
    return "Gemini ha rechazado la petición; revisa GEMINI_API_KEY. Se muestran frases literales.";
  }
  return `Gemini devolvió ${res.status}. Se muestran frases literales del informe.`;
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
    const res = await fetch(endpoint(), {
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
      return extractiveSummary(texto, await describirFallo(res));
    }

    const json = (await res.json()) as GeminiResponse;
    const bruto = textoDeRespuesta(json);
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
