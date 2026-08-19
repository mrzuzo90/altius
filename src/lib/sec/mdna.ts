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
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|tr|h[1-6]|li|table)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#8217;|&rsquo;/gi, "’")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t ]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

type Patrones = { inicio: RegExp; fines: RegExp[] };

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

  const bruto = texto.slice(mejor.desde, mejor.hasta).trim();
  // Un intervalo diminuto significa que solo se encontró el índice.
  if (bruto.length < 1500) return null;

  const text = bruto.length > MAX_CARACTERES ? `${bruto.slice(0, MAX_CARACTERES)}\n[…]` : bruto;
  return { text, chars: bruto.length };
}
