import { SYSTEM_MDNA, userPromptMdna } from "./prompts";
import { getCacheStore, TTL } from "@/lib/cache/store";
import { fetchWithTimeout } from "@/lib/http";

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
 * Modelos disponibles con cuota gratuita activa en Google AI Studio.
 * Se prueba en orden de preferencia (`gemini-flash-latest` -> `gemini-flash-lite-latest`).
 */
export const MODELOS_CANDIDATOS = ["gemini-flash-latest", "gemini-flash-lite-latest"];

function endpoints(): string[] {
  const custom = process.env.GEMINI_MODEL?.trim();
  const list = custom ? [custom, ...MODELOS_CANDIDATOS.filter((m) => m !== custom)] : MODELOS_CANDIDATOS;
  return list.map((m) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`);
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
      "El modelo de Gemini está saturado temporalmente. Se muestran frases literales del informe."
    );
  }
  if (res.status === 404 && /no longer available/i.test(mensaje)) {
    return (
      "El modelo configurado ya no está disponible para esta cuenta. Se muestran frases literales del informe."
    );
  }
  if (res.status === 400 || res.status === 403) {
    return "Gemini ha rechazado la petición; revisa GEMINI_API_KEY. Se muestran frases literales.";
  }
  return `Gemini devolvió ${res.status}. Se muestran frases literales del informe.`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Ejecuta la llamada a Gemini probando la lista de modelos compatibles.
 */
export async function pedirConModelos(body: string, apiKey: string): Promise<Response> {
  const urls = endpoints();
  let ultima: Response | null = null;

  for (const url of urls) {
    for (let intento = 0; intento < 2; intento++) {
      if (intento > 0) await sleep(500);
      try {
        const res = await fetchWithTimeout(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body,
          cache: "no-store",
        }, 30_000);
        if (res.ok) return res;
        ultima = res;
        // Si es 404, salta de inmediato al siguiente modelo sin reintentar
        if (res.status === 404) break;
      } catch {
        // Error de red, probar siguiente intento/modelo
      }
    }
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
  if (enCache && enCache.source === "gemini") return enCache;

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return extractiveSummary(
      texto,
      "No hay GEMINI_API_KEY configurada. Se muestran frases literales del informe, sin resumir.",
    );
  }

  try {
    const payload = JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_MDNA }] },
      contents: [{ role: "user", parts: [{ text: userPromptMdna(empresa, periodo, texto) }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: SCHEMA,
      },
    });

    const res = await pedirConModelos(payload, apiKey);

    if (!res || !res.ok) {
      const msg = res ? await describirFallo(res) : "No se pudo contactar con Gemini.";
      return extractiveSummary(texto, msg);
    }

    const json = (await res.json()) as GeminiResponse;
    const bruto = textoDeRespuesta(json);
    if (!bruto) {
      return extractiveSummary(texto, "Gemini no devolvió contenido. Se muestran frases literales.");
    }

    const parsed = JSON.parse(bruto) as Omit<MdnaBody, "source">;
    const salida: MdnaBody = {
      drivers: parsed.drivers ?? [],
      risks: parsed.risks ?? [],
      tone: parsed.tone ?? "",
      source: "gemini",
    };
    // Solo cacheamos si el modelo redactó con éxito
    await cache.set(cacheKey, salida, TTL.filingDocument);
    return salida;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return extractiveSummary(texto, `Fallo al contactar con Gemini (${msg}). Se muestran frases literales.`);
  }
}
