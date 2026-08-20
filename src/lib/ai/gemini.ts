import { SYSTEM_MDNA, userPromptMdna } from "./prompts";
import { getCacheStore, TTL } from "@/lib/cache/store";

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
 * Utiliza `gemini-2.5-flash` o `gemini-1.5-flash` con cuota gratuita en el API v1beta de Google.
 * Se puede cambiar sin tocar código con la variable de entorno GEMINI_MODEL.
 */
const MODELO_POR_DEFECTO = "gemini-2.5-flash";

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
    tone: "No se valora el tono: los puntos anteriores son frases literales del informe, sin interpretación por parte de un modelo.",
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
  if (res.status === 503) {
    return (
      "El modelo de Gemini está saturado y no ha respondido tras varios " +
      "intentos. Se muestran frases literales del informe; vuelve a cargar en un rato."
    );
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Códigos que merecen reintento: sobrecarga del modelo o límite por minuto. */
const REINTENTABLES = new Set([429, 500, 502, 503, 504]);

/**
 * Llama al API reintentando los fallos transitorios.
 *
 * Gemini devuelve 503 cuando el modelo está saturado, y ocurre de verdad: el
 * primer despliegue en producción degradó a extractivo por un 503 que, medido
 * acto seguido, no se reprodujo en cuatro intentos seguidos. Un único intento
 * convierte un hipo de unos segundos en un resumen degradado durante los treinta
 * días que dura la caché.
 */
async function pedirConReintentos(body: string, apiKey: string): Promise<Response> {
  let ultima: Response | null = null;
  for (let intento = 0; intento < 3; intento++) {
    if (intento > 0) await sleep(2 ** intento * 700);
    const res = await fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body,
      cache: "no-store",
    });
    if (res.ok || !REINTENTABLES.has(res.status)) return res;
    ultima = res;
  }
  return ultima!;
}

export async function summarizeMdna(
  texto: string,
  empresa: string,
  periodo: string,
): Promise<MdnaBody> {
  const cacheKey = `mdna:summary:${empresa.replace(/\W+/g, "_")}:${periodo}`;
  const cache = getCacheStore();
  const enCache = await cache.get<MdnaBody>(cacheKey);
  if (enCache) return enCache;

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    const res = extractiveSummary(
      texto,
      "No hay GEMINI_API_KEY configurada. Se muestran frases literales del informe, sin resumir.",
    );
    await cache.set(cacheKey, res, TTL.filingDocument);
    return res;
  }

  try {
    const res = await pedirConReintentos(
      JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_MDNA }] },
        contents: [{ role: "user", parts: [{ text: userPromptMdna(empresa, periodo, texto) }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: SCHEMA,
        },
      }),
      apiKey,
    );

    if (!res.ok) {
      const degradado = extractiveSummary(texto, await describirFallo(res));
      await cache.set(cacheKey, degradado, TTL.filingDocument);
      return degradado;
    }

    const json = (await res.json()) as GeminiResponse;
    const bruto = textoDeRespuesta(json);
    if (!bruto) {
      const degradado = extractiveSummary(texto, "Gemini no devolvió contenido. Se muestran frases literales.");
      await cache.set(cacheKey, degradado, TTL.filingDocument);
      return degradado;
    }

    const parsed = JSON.parse(bruto) as Omit<MdnaBody, "source">;
    const salida: MdnaBody = {
      drivers: parsed.drivers ?? [],
      risks: parsed.risks ?? [],
      tone: parsed.tone ?? "",
      source: "gemini",
    };
    await cache.set(cacheKey, salida, TTL.filingDocument);
    return salida;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    const degradado = extractiveSummary(texto, `Fallo al contactar con Gemini (${msg}). Se muestran frases literales.`);
    return degradado;
  }
}
