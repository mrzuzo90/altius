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

const PATRON_NEGOCIO: Patrones = {
  inicio: /item\s*1\s*[.:—–-]?\s*business\b/gi,
  fines: [/item\s*1a\s*[.:—–-]?\s*risk\s+factors/gi, /item\s*1a\s*[.:—–-]/gi],
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
export function extractBusinessSummary(html: string, maxChars = 700): string | null {
  const texto = limpiarMobiliarioDePagina(htmlToText(html));
  const inicios = todasLasPosiciones(texto, PATRON_NEGOCIO.inicio);
  if (inicios.length === 0) return null;

  const finales = PATRON_NEGOCIO.fines
    .flatMap((re) => todasLasPosiciones(texto, re))
    .sort((a, b) => a - b);

  let mejor: { desde: number; hasta: number } | null = null;
  for (const desde of inicios) {
    const hasta = finales.find((f) => f > desde) ?? texto.length;
    if (!mejor || hasta - desde > mejor.hasta - mejor.desde) mejor = { desde, hasta };
  }
  if (!mejor || mejor.hasta - mejor.desde < 1000) return null;

  const cuerpo = texto
    .slice(mejor.desde, mejor.hasta)
    // Descarta el propio encabezado y los rótulos cortos de subapartado.
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 120 && !/^item\s*1\b/i.test(l))
    .join(" ");
  if (!cuerpo) return null;

  if (cuerpo.length <= maxChars) return cuerpo;
  const recorte = cuerpo.slice(0, maxChars);
  const corte = recorte.lastIndexOf(". ");
  return corte > maxChars * 0.4 ? recorte.slice(0, corte + 1) : `${recorte.trimEnd()}…`;
}
