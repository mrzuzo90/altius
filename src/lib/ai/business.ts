import { getCacheStore, TTL } from "@/lib/cache/store";
import { pedirConModelos, textoDeRespuesta } from "./gemini";

export type BusinessReportNarrative = {
  activity: string;
  revenueModel: string;
  source: "gemini";
};

const SCHEMA = {
  type: "OBJECT",
  properties: {
    activity: { type: "STRING" },
    revenueModel: { type: "STRING" },
  },
  required: ["activity", "revenueModel"],
};

export const SYSTEM_BUSINESS = `Eres un redactor financiero que explica empresas a una persona sin conocimientos técnicos.

Reglas absolutas:
- Usa únicamente el texto del informe anual suministrado. No añadas productos, cifras ni conocimientos externos.
- Escribe en español de España, con lenguaje coloquial, directo y preciso.
- En activity di qué vende o hace realmente la empresa. Nombra productos, marcas, plataformas o servicios concretos que aparezcan en el informe. Evita frases vacías como "ofrece soluciones de software".
- En revenueModel explica por qué cosas cobra: ventas de producto, suscripciones, consumo, comisiones, publicidad, intereses, primas, mantenimiento u otras vías mencionadas.
- No afirmes qué división es la más rentable: eso se calcula aparte con beneficio segmentado. No confundas nunca ingresos con beneficio.
- Dos o tres frases cortas por campo. Sin listas, opiniones ni recomendaciones de inversión.`;

export function businessPrompt(company: string, period: string, reportText: string): string {
  return `Empresa: ${company}\nPeriodo: ${period}\n\n--- APARTADO DEL NEGOCIO ---\n${reportText}\n--- FIN ---`;
}

export async function summarizeBusinessReport(
  reportText: string,
  company: string,
  period: string,
): Promise<BusinessReportNarrative | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || reportText.trim().length < 200) return null;
  const cache = getCacheStore();
  const key = `business:plain:v1:${company.replace(/\W+/g, "_")}:${period}`;
  const cached = await cache.get<BusinessReportNarrative>(key);
  if (cached?.source === "gemini") return cached;

  try {
    const payload = JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_BUSINESS }] },
      contents: [{ role: "user", parts: [{ text: businessPrompt(company, period, reportText.slice(0, 45_000)) }] }],
      generationConfig: {
        temperature: 0.15,
        responseMimeType: "application/json",
        responseSchema: SCHEMA,
      },
    });
    const response = await pedirConModelos(payload, apiKey);
    if (!response?.ok) return null;
    const raw = textoDeRespuesta(await response.json());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BusinessReportNarrative>;
    if (!parsed.activity?.trim() || !parsed.revenueModel?.trim()) return null;
    const result: BusinessReportNarrative = {
      activity: parsed.activity.trim(),
      revenueModel: parsed.revenueModel.trim(),
      source: "gemini",
    };
    await cache.set(key, result, TTL.filingDocument);
    return result;
  } catch {
    return null;
  }
}
