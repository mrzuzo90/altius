/**
 * Extracción del apartado de análisis de la dirección (MD&A) de un informe.
 *
 * El apartado es el "Item 7" en los 10-K y el "Item 2" en los 10-Q. La
 * dificultad no es encontrarlo, sino no confundirlo con el índice: el mismo
 * encabezado aparece dos veces en el documento, primero como línea de sumario
 * y luego como cuerpo. La heurística es quedarse con el intervalo más largo
 * entre un inicio y su fin, que siempre es el cuerpo.
 */

const MAX_CARACTERES = 200_000;

export type SeccionExtraida = { text: string; chars: number };

export function htmlToText(html: string): string {
  return (
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\/(p|div|tr|h[1-6]|li|table)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      // Las entidades numéricas se decodifican antes que &amp;. Al revés,
      // "&amp;#174;" se convertiría en "&#174;" y ya nadie lo procesaría:
      // los 10-K están llenos de símbolos de marca registrada así.
      .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
        String.fromCodePoint(Number.parseInt(hex, 16)),
      )
      .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number.parseInt(dec, 10)))
      .replace(/&nbsp;/gi, " ")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&(rsquo|apos);/gi, "\u2019")
      .replace(/&(ldquo|rdquo);/gi, '"')
      .replace(/&(reg|trade|copy|mdash|ndash|hellip);/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/[ \t\u00a0]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n\s*\n\s*\n+/g, "\n\n")
      .trim()
  );
}

type Patrones = { inicio: RegExp; fines: RegExp[] };

export type AnnualBusinessForm = "10-K" | "20-F" | "40-F" | "ESEF";

const PATRONES_NEGOCIO: Record<AnnualBusinessForm, Patrones> = {
  "10-K": {
    inicio: /item\s*1\s*[.:—–-]?\s*b\s*u\s*s\s*i\s*n\s*e\s*s\s*s\b/gi,
    fines: [/item\s*1a\s*[.:—–-]?\s*r\s*i\s*s\s*k\s+f\s*a\s*c\s*t\s*o\s*r\s*s/gi, /item\s*1a\s*[.:—–-]/gi],
  },
  "20-F": {
    inicio: /item\s*4\s*[.:—–-]?\s*information\s+on\s+the\s+company\b/gi,
    fines: [
      /item\s*4a\s*[.:—–-]?\s*unresolved\s+staff\s+comments/gi,
      /item\s*5\s*[.:—–-]?\s*operating\s+and\s+financial\s+review/gi,
      /item\s*5\s*[.:—–-]/gi,
    ],
  },
  "40-F": {
    inicio: /(?:business\s+overview|description\s+of\s+(?:our|the)\s+business|our\s+business)\b/gi,
    fines: [
      /risk\s+factors\b/gi,
      /management[’'`s\s]*\s*discussion\s+and\s+analysis\b/gi,
      /audited\s+financial\s+statements\b/gi,
    ],
  },
  ESEF: {
    inicio: /(?:our\s+business|business\s+model|business\s+overview|group\s+profile|who\s+we\s+are|description\s+of\s+(?:our|the)\s+business|mod[eè]le\s+d['’]affaires|pr[eé]sentation\s+(?:du\s+groupe|des\s+activit[eé]s)|activit[eé]s\s+du\s+groupe|nos\s+activit[eé]s|modelo\s+de\s+negocio|descripci[oó]n\s+del\s+negocio|actividades\s+del\s+grupo|gesch[aä]ftsmodell|gesch[aä]ftst[aä]tigkeit|konzernprofil|bedrijfsmodel)\b/gi,
    fines: [
      /(?:principal|material)\s+risks\b/gi,
      /risk\s+factors\b/gi,
      /facteurs\s+de\s+risque\b/gi,
      /factores\s+de\s+riesgo\b/gi,
      /risikobericht\b/gi,
      /corporate\s+governance\b/gi,
      /financial\s+statements\b/gi,
      /[eé]tats\s+financiers\b/gi,
      /estados\s+financieros\b/gi,
      /konzernabschluss\b/gi,
    ],
  },
};

const PATRONES: Record<"10-K" | "10-Q", Patrones> = {
  "10-K": {
    inicio: /item\s*7\s*[.:—–-]?\s*management[’'`s\s]*\s*discussion/gi,
    fines: [
      /item\s*7a\s*[.:—–-]?\s*quantitative/gi,
      /item\s*7a\s*[.:—–-]/gi,
      /item\s*8\s*[.:—–-]?\s*financial\s+statements/gi,
    ],
  },
  "10-Q": {
    inicio: /item\s*2\s*[.:—–-]?\s*management[’'`s\s]*\s*discussion/gi,
    fines: [
      /item\s*3\s*[.:—–-]?\s*quantitative/gi,
      /item\s*4\s*[.:—–-]?\s*controls/gi,
    ],
  },
};

const todasLasPosiciones = (texto: string, re: RegExp): number[] => {
  const salida: number[] = [];
  const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  let m: RegExpExecArray | null;
  while ((m = r.exec(texto)) !== null) {
    salida.push(m.index);
    if (m.index === r.lastIndex) r.lastIndex++;
  }
  return salida;
};

/**
 * Elimina el mobiliario de página del informe.
 *
 * Los 10-K llevan un encabezado repetido del tipo "Apple Inc. | 2025 Form 10-K
 * | 21", que al aplanar el HTML queda como línea suelta y contamina tanto el
 * resumen extractivo como el contexto que se envía al modelo.
 *
 * El filtro es por líneas completas a propósito: intentar recortarlo dentro de
 * una línea se come la frase anterior, porque el nombre de la empresa lleva
 * puntos y no hay forma fiable de saber dónde empieza el encabezado.
 */
export function limpiarMobiliarioDePagina(texto: string): string {
  return texto
    .split("\n")
    .filter((linea) => {
      const l = linea.trim();
      if (!l) return true;
      // "Apple Inc. | 2025 Form 10-K | 21" — encabezado de página completo.
      if (/\|\s*(?:\d{4}\s+)?Form\s+10-[KQ]\s*\|\s*\d+$/i.test(l)) return false;
      if (/^table of contents$/i.test(l)) return false;
      // Número de página suelto.
      if (/^\d{1,3}$/.test(l)) return false;
      return true;
    })
    .join("\n");
}

export function extractMdna(html: string, form: "10-K" | "10-Q" = "10-K"): SeccionExtraida | null {
  const texto = htmlToText(html);
  const { inicio, fines } = PATRONES[form];

  const inicios = todasLasPosiciones(texto, inicio);
  if (inicios.length === 0) return null;

  const finales = fines.flatMap((re) => todasLasPosiciones(texto, re)).sort((a, b) => a - b);

  let mejor: { desde: number; hasta: number } | null = null;
  for (const desde of inicios) {
    // El primer cierre posterior al inicio delimita el candidato.
    const hasta = finales.find((f) => f > desde) ?? texto.length;
    // El candidato del índice mide unas pocas decenas de caracteres; el del
    // cuerpo, decenas de miles. Quedarse con el más largo los distingue.
    if (!mejor || hasta - desde > mejor.hasta - mejor.desde) mejor = { desde, hasta };
  }
  if (!mejor) return null;

  const bruto = limpiarMobiliarioDePagina(texto.slice(mejor.desde, mejor.hasta)).trim();
  // Un intervalo diminuto significa que solo se encontró el índice.
  if (bruto.length < 1500) return null;

  const text = bruto.length > MAX_CARACTERES ? `${bruto.slice(0, MAX_CARACTERES)}\n[…]` : bruto;
  return { text, chars: bruto.length };
}

/**
 * Descripción del negocio a partir del apartado "Item 1. Business" del 10-K.
 *
 * Se devuelve texto literal del informe, recortado en un límite de frase. Es la
 * única descripción de empresa que Altius muestra: redactarla nosotros sería
 * poner en boca de la empresa palabras que no ha escrito, y el registro de la
 * SEC no incluye ninguna descripción libre utilizable.
 */
function businessParagraphScore(line: string): number {
  let score = 0;
  if (/\b(?:we|our|the company|the group)\b/i.test(line)) score += 3;
  if (/\b(?:design|develop|manufactur|market|sell|offer|provide|operat|distribut|produc|serv|specializ)\w*/i.test(line)) score += 7;
  if (/\b(?:product|service|customer|platform|business|subscription|software|device|medicine|energy|bank|insurance)\w*/i.test(line)) score += 3;
  if (line.length >= 120 && line.length <= 1200) score += 2;
  if (/forward-looking|risk factors|uncertaint|financial statements|accounting standards/i.test(line)) score -= 8;
  return score;
}

function businessExcerpt(text: string, maxChars: number): string | null {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length >= 60 && !/^item\s*\d/i.test(line));
  if (lines.length === 0) return null;

  const ranked = lines
    .map((line, index) => ({ line, index, score: businessParagraphScore(line) }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const explicitOperatingStatement = ranked
    .sort((a, b) => a.index - b.index)
    .find(({ line }) =>
      businessParagraphScore(line) >= 5
      && !/forward-looking|risk factors|uncertaint|financial statements|accounting standards/i.test(line)
      && /\b(?:we|our|the company|the group)\b/i.test(line)
      && /\b(?:design|develop|manufactur|market|sell|offer|provide|operat|distribut|produc|serv|specializ)\w*/i.test(line),
    );
  const best = explicitOperatingStatement ?? ranked.sort((a, b) => b.score - a.score || a.index - b.index)[0];
  if (!best || best.score < 5) return null;

  const selected = lines.slice(best.index, best.index + 3).join(" ");
  if (selected.length <= maxChars) return selected;
  const cut = selected.slice(0, maxChars);
  const sentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "));
  return sentence > maxChars * 0.45 ? cut.slice(0, sentence + 1) : `${cut.trimEnd()}…`;
}

export function extractBusinessSummary(
  html: string,
  form: AnnualBusinessForm = "10-K",
  maxChars = 900,
): string | null {
  const section = extractBusinessSection(html, form);
  if (section) return businessExcerpt(section.text, maxChars);

  const texto = limpiarMobiliarioDePagina(htmlToText(html));
  return businessExcerpt(texto, maxChars);
}

/**
 * Devuelve el cuerpo del apartado que describe el negocio. A diferencia del
 * resumen corto, conserva suficiente contexto para identificar productos,
 * formas de cobro y divisiones sin enviar el informe anual entero al modelo.
 */
export function extractBusinessSection(
  html: string,
  form: AnnualBusinessForm = "10-K",
  maxChars = 45_000,
): SeccionExtraida | null {
  const texto = limpiarMobiliarioDePagina(htmlToText(html));
  const patrones = PATRONES_NEGOCIO[form];
  const inicios = todasLasPosiciones(texto, patrones.inicio);
  if (inicios.length === 0) return null;

  const finales = patrones.fines
    .flatMap((re) => todasLasPosiciones(texto, re))
    .sort((a, b) => a - b);

  let mejor: { desde: number; hasta: number } | null = null;
  for (const desde of inicios) {
    const hasta = finales.find((f) => f > desde) ?? texto.length;
    if (!mejor || hasta - desde > mejor.hasta - mejor.desde) mejor = { desde, hasta };
  }
  if (!mejor) return null;

  const bruto = limpiarMobiliarioDePagina(texto.slice(mejor.desde, mejor.hasta)).trim();
  if (bruto.length < 200) return null;
  return {
    text: bruto.length > maxChars ? `${bruto.slice(0, maxChars)}\n[…]` : bruto,
    chars: bruto.length,
  };
}
