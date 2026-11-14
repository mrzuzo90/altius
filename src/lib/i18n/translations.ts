import { UI_DICTIONARY } from "./dictionaries/ui";
import { COMPANY_DICTIONARY } from "./dictionaries/company";
import { MARKETS_DICTIONARY } from "./dictionaries/markets";

export type Language = "es" | "en";

export interface DynamicPattern {
  pattern: RegExp;
  replace: (...args: string[]) => string;
}

/**
 * Fragmentos sueltos provocados por comentarios <!-- --> de React SSR cuando
 * interpola variables dentro de JSX (por ejemplo: {"Cobertura "} {n} {"/6"}).
 */
const FRAGMENT_DICTIONARY: Record<string, string> = {
  "Crecimiento (": "Growth (",
  "años):": "yrs):",
  "años): ": "yrs): ",
  "%/año)": "%/yr)",
  "%/año": "%/yr",
  "· Beneficio": "· Net income",
  "Todos (": "All (",
  "Todas (": "All (",
  "Prensa (": "Press (",
  "SEC 8-K (": "SEC 8-K (",
  "Ver": "View",
  "Abrir en": "Open in",
  "hace": "ago",
  "desde": "from",
  "hasta": "to",
  "durante": "over",
  "frente a": "vs.",
  "Frente a": "Vs.",
  "ejercicios": "fiscal years",
  "ejercicios:": "fiscal years:",
  "periodos": "periods",
  "periodo": "period",
  "datos": "data points",
  "dato": "data point",
  "observaciones": "observations",
  "observación": "observation",
  "activos": "assets",
  "selectivos": "indices",
  "índices": "indices",
  "pares oficiales": "official pairs",
  "solo en seguimiento": "tracking only",
  "con análisis disponible": "ready to view",
  "contratos analizados": "contracts analyzed",
  "caracteres analizados": "characters analyzed",
  "claves": "keys",
  "clave": "key",
  "años": "years",
  "año": "year",
  "meses": "months",
  "mes": "month",
  "días": "days",
  "día": "day",
  "por asignar": "left to assign",
  "M€": "$M EUR",
  "M$": "$M",
  "B€": "B EUR",
  "B$": "B USD",
  "mil millones": "billion",
  "millones": "million",
  "miles": "thousand",
  "dólares": "dollars",
  "euros": "euros",
  "libras": "pounds",
  "yenes": "yen",
  "francos suizos": "Swiss francs",
  "coronas": "krona",
  "al año": "a year",
  "al mes": "a month",
  "anual": "a year",
  "anualizado": "annualized",
  "de diferencia": "difference",
  "en rango": "in range",
  "en seguimiento": "tracked",
  "sin datos": "no data",
  "sin cambios": "unchanged",
  "dispositivos móviles": "mobile devices",
  "servicios conectados": "connected services",
  "hardware de consumo": "consumer hardware",
  "productos electrónicos": "electronic products",
  "equipos de telecomunicaciones": "telecom equipment",
  "servicios en la nube": "cloud services",
  "redes móviles": "mobile networks",
  "infraestructura de red": "network infrastructure",
};

export const FINANCIAL_DICTIONARY: Record<string, string> = {
  ...UI_DICTIONARY,
  ...COMPANY_DICTIONARY,
  ...MARKETS_DICTIONARY,
  ...FRAGMENT_DICTIONARY,
};

const LOWERCASE_DICTIONARY = new Map<string, string>();
for (const [es, en] of Object.entries(FINANCIAL_DICTIONARY)) {
  const lower = es.toLowerCase();
  if (!LOWERCASE_DICTIONARY.has(lower)) {
    LOWERCASE_DICTIONARY.set(lower, en);
  }
}

const SPANISH_MONTHS_LONG: Record<string, string> = {
  enero: "Jan",
  febrero: "Feb",
  marzo: "Mar",
  abril: "Apr",
  mayo: "May",
  junio: "Jun",
  julio: "Jul",
  agosto: "Aug",
  septiembre: "Sep",
  octubre: "Oct",
  noviembre: "Nov",
  diciembre: "Dec",
};

const SPANISH_MONTHS_SHORT: Record<string, string> = {
  ene: "Jan",
  feb: "Feb",
  mar: "Mar",
  abr: "Apr",
  may: "May",
  jun: "Jun",
  jul: "Jul",
  ago: "Aug",
  sep: "Sep",
  sept: "Sep",
  oct: "Oct",
  nov: "Nov",
  dic: "Dec",
};

const METRIC_LABELS: Record<string, string> = {
  "ingresos": "revenue",
  "beneficio neto": "net income",
  "beneficio por acción": "EPS",
  "flujo de caja libre": "free cash flow",
  "flujo caja libre": "free cash flow",
  "margen neto": "net margin",
  "margen operativo": "operating margin",
  "margen op.": "op. margin",
  "margen bruto": "gross margin",
  "resultado operativo": "operating income",
  "caja operativa": "operating cash flow",
  "roic": "ROIC",
  "roe": "ROE",
  "roe sectorial": "sector ROE",
  "roe (proxy)": "ROE (proxy)",
  "ebitda": "EBITDA",
  "patrimonio": "equity",
  "deuda neta": "net debt",
  "deuda total": "total debt",
  "activos totales": "total assets",
  "acciones diluidas": "diluted shares",
  "capex": "CapEx",
  "per": "P/E",
};

const PERIOD_LABELS: Record<string, string> = {
  "anual": "Annual",
  "trimestral": "Quarterly",
  "trimestrales": "Quarterly",
  "anuales": "Annual",
};

function translateSpanishDate(raw: string): string {
  const trimmed = raw.trim();
  const longMatch = trimmed.match(
    /^(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})$/i
  );
  if (longMatch) {
    const [, day, month, year] = longMatch;
    const enMonth = SPANISH_MONTHS_LONG[month.toLowerCase()] ?? month;
    return `${enMonth} ${day}, ${year}`;
  }

  const shortMatch = trimmed.match(
    /^(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sept?|oct|nov|dic)\.?\s+(\d{4})$/i
  );
  if (shortMatch) {
    const [, day, month, year] = shortMatch;
    const enMonth = SPANISH_MONTHS_SHORT[month.toLowerCase()] ?? month;
    return `${enMonth} ${day}, ${year}`;
  }

  return trimmed;
}

function toEnglishList(text: string): string {
  const cleaned = text.trim();
  if (!cleaned) return cleaned;
  // Translate known items inside comma/y lists if present
  const parts = cleaned
    .split(/,\s*|\s+y\s+/i)
    .map((part) => {
      const p = part.trim();
      if (!p) return "";
      const direct = FINANCIAL_DICTIONARY[p] ?? LOWERCASE_DICTIONARY.get(p.toLowerCase());
      return direct ?? p;
    })
    .filter(Boolean);

  if (parts.length <= 1) return parts[0] ?? cleaned;
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function translateInnerToken(raw: string): string {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (METRIC_LABELS[lower]) return METRIC_LABELS[lower];
  if (PERIOD_LABELS[lower]) return PERIOD_LABELS[lower];
  const exact = FINANCIAL_DICTIONARY[trimmed];
  if (exact) return exact;
  const ci = LOWERCASE_DICTIONARY.get(lower);
  if (ci) return ci;
  return translateSpanishDate(trimmed);
}

function translateScaleWord(word: string): string {
  const lower = word.toLowerCase();
  if (lower.includes("mil millones") || lower === "billones") return "billions";
  if (lower.includes("millones")) return "millions";
  if (lower.includes("miles")) return "thousands";
  if (lower.includes("dólar") || lower.includes("usd")) return "USD";
  if (lower.includes("euro") || lower.includes("eur")) return "EUR";
  return translateInnerToken(word);
}

export const DYNAMIC_PATTERNS: DynamicPattern[] = [
  // =========================================================================
  // 1. RESEARCH SNAPSHOT (company-research.ts concreteActivity & business copy)
  // =========================================================================
  {
    pattern: /^(?:Diseña|Fabrica|Vende|Ofrece|Opera|Desarrolla|Produce|Distribuye|Comercializa)\s+(.+?)\s+y\s+(.+)\.$/i,
    replace: (full, a, b) => {
      const verb = full.split(/\s+/)[0].toLowerCase();
      const enVerb: Record<string, string> = {
        diseña: "Designs",
        fabrica: "Makes",
        vende: "Sells",
        ofrece: "Offers",
        opera: "Runs",
        desarrolla: "Builds",
        produce: "Produces",
        distribuye: "Distributes",
        comercializa: "Markets",
      };
      return `${enVerb[verb] ?? "Offers"} ${toEnglishList(`${a}, ${b}`)}.`;
    },
  },
  {
    pattern: /^Su negocio principal gira en torno a\s+(.+)\.$/i,
    replace: (_m, topic) => `Its core business centers on ${toEnglishList(topic)}.`,
  },
  {
    pattern: /^Genera ingresos principalmente a través de\s+(.+)\.$/i,
    replace: (_m, topic) => `Generates most of its revenue through ${toEnglishList(topic)}.`,
  },
  {
    pattern: /^El motor económico combina\s+(.+?)\s+con\s+(.+)\.$/i,
    replace: (_m, a, b) => `Its business engine combines ${toEnglishList(a)} with ${toEnglishList(b)}.`,
  },
  {
    pattern: /^Sus principales fuentes de negocio son\s+(.+)\.$/i,
    replace: (_m, items) => `Its main revenue drivers are ${toEnglishList(items)}.`,
  },
  {
    pattern: /^Sus líneas declaradas incluyen\s+(.+)\.$/i,
    replace: (_m, items) => `Its reported business lines include ${toEnglishList(items)}.`,
  },
  {
    pattern: /^Opera dentro del sector de\s+(.+?)\s+con foco en\s+(.+)\.$/i,
    replace: (_m, sector, focus) =>
      `Operates in the ${translateInnerToken(sector)} industry, focusing on ${toEnglishList(focus)}.`,
  },
  {
    pattern: /^(\d+(?:[.,]\d+)?)%\s+de las ventas vienen de\s+(.+)$/i,
    replace: (_m, pct, segment) => `${pct}% of sales come from ${translateInnerToken(segment)}`,
  },
  {
    pattern: /^El segmento más grande es\s+(.+?)\s*\((\d+(?:[.,]\d+)?)%\)\.?$/i,
    replace: (_m, seg, pct) => `Largest segment: ${translateInnerToken(seg)} (${pct}%).`,
  },

  // =========================================================================
  // 2. THE 6 KEYS SCORECARD & SCREENER (quality.ts & quality-scorecard.tsx)
  // =========================================================================
  {
    pattern: /^Cobertura\s+(\d+)\s*\/\s*(\d+)$/i,
    replace: (_m, a, b) => `Coverage ${a}/${b}`,
  },
  {
    pattern: /^(\d+)\s+de\s+(\d+)\s+claves\s+cumplen\s+el\s+criterio\s+cuantitativo(.*)$/i,
    replace: (_m, a, b, tail) => {
      const extra = tail.trim()
        ? ` ${translateToEnglish(tail.trim())}`
        : "";
      return `${a} of ${b} keys meet the benchmark${extra}`;
    },
  },
  {
    pattern: /^Falta\s+1\s+clave\s+por\s+falta\s+de\s+datos\s+comparables\.?$/i,
    replace: () => "1 key is missing comparable data.",
  },
  {
    pattern: /^Faltan\s+(\d+)\s+claves\s+por\s+falta\s+de\s+datos\s+comparables\.?$/i,
    replace: (_m, n) => `${n} keys are missing comparable data.`,
  },
  {
    pattern: /^Las seis claves tienen datos comparables\.?$/i,
    replace: () => "All 6 keys have enough comparable data.",
  },
  {
    pattern: /^Evaluando\s+(\d+)\s+ejercicios$/i,
    replace: (_m, n) => `Based on ${n} fiscal years`,
  },
  {
    pattern: /^(\d+)\s+ejercicios:\s*(.+)$/i,
    replace: (_m, n, rest) => `${n} years: ${translateToEnglish(rest)}`,
  },
  {
    pattern: /^(\d+)\s*\/\s*(\d+)\s+años positivos$/i,
    replace: (_m, a, b) => `${a}/${b} positive years`,
  },
  {
    pattern: /^ingresos\s+([+\-−]?[\d.,]+%)\s*·\s*beneficio por acción\s+([+\-−]?[\d.,]+%)$/i,
    replace: (_m, rev, eps) => `revenue ${rev} · EPS ${eps}`,
  },
  {
    pattern: /^ingresos\s+([+\-−]?[\d.,]+%)$/i,
    replace: (_m, rev) => `revenue ${rev}`,
  },
  {
    pattern: /^beneficio por acción\s+([+\-−]?[\d.,]+%)$/i,
    replace: (_m, eps) => `EPS ${eps}`,
  },
  {
    pattern: /^(ROIC|ROE sectorial|ROE \(proxy\)|ROE)\s+([+\-−]?[\d.,]+%)\s*·\s*(\d+\/\d+)\s+años positivos$/i,
    replace: (_m, metric, pct, yrs) => `${translateInnerToken(metric)} ${pct} · ${yrs} positive years`,
  },
  {
    pattern: /^(ROIC|ROE sectorial|ROE \(proxy\)|ROE)\s+([+\-−]?[\d.,]+%)$/i,
    replace: (_m, metric, pct) => `${translateInnerToken(metric)} ${pct}`,
  },
  {
    pattern: /^Patrimonio\/activo\s+([\d.,]+%)$/i,
    replace: (_m, pct) => `Equity / assets ${pct}`,
  },
  {
    pattern: /^([\d.,]+x)\s+EBITDA$/i,
    replace: (_m, x) => `${x} EBITDA`,
  },
  {
    pattern: /^Acciones\s+([+\-−]?[\d.,]+%)\s+anual$/i,
    replace: (_m, pct) => `Shares ${pct}/yr`,
  },
  {
    pattern: /^CFO\/beneficio\s+([\d.,]+%)\s*·\s*FCF positivo\s+(\d+\/\d+)$/i,
    replace: (_m, pct, yrs) => `Cash/earnings ${pct} · ${yrs} positive FCF years`,
  },
  {
    pattern: /^PER\s+([\d.,]+x)\s*·\s*([+\-−]?[\d.,]+%)\s+vs\s+historia$/i,
    replace: (_m, pe, diff) => `P/E ${pe} · ${diff} vs. history`,
  },
  {
    pattern: /^PER\s+([\d.,]+x)$/i,
    replace: (_m, pe) => `P/E ${pe}`,
  },
  {
    pattern: /^(ROIC|ROE|ROE sectorial|Margen neto|Margen operativo)\s+mediano\s+de\s+([+\-−]?[\d.,]+%)\s+durante\s+(\d+)\s+ejercicios(?:\s+\((.+)\))?\.?$/i,
    replace: (_m, metric, val, yrs, tail) => {
      const tailEn = tail ? ` (${translateToEnglish(tail)})` : "";
      return `Median ${translateInnerToken(metric)} of ${val} over ${yrs} fiscal years${tailEn}.`;
    },
  },
  {
    pattern: /^Apalancamiento\s+mediano\s+de\s+([+\-−]?[\d.,]+x)\s+y\s+último\s+de\s+([+\-−]?[\d.,]+x)\s+en\s+(\d+)\s+ejercicios\.?$/i,
    replace: (_m, med, last, yrs) =>
      `Median debt leverage of ${med} (most recent: ${last}) across ${yrs} fiscal years.`,
  },
  {
    pattern: /^Colchón\s+mediano\s+del\s+([\d.,]+%)\s+del\s+activo\s+en\s+(\d+)\s+ejercicios\s*\((.+)\)\.?$/i,
    replace: (_m, pct, yrs, extra) =>
      `Equity buffer averages ${pct} of total assets over ${yrs} fiscal years (${translateToEnglish(extra)}).`,
  },
  {
    pattern: /^Colchón\s+mediano\s+del\s+([\d.,]+%)\s+del\s+activo\s+en\s+(\d+)\s+ejercicios\.?$/i,
    replace: (_m, pct, yrs) =>
      `Equity buffer averages ${pct} of total assets over ${yrs} fiscal years.`,
  },
  {
    pattern: /^Las acciones diluidas cambian un\s+([+\-−]?[\d.,]+%)\s+anual\s+durante\s+(\d+)\s+ejercicios\.?$/i,
    replace: (_m, pct, yrs) =>
      `Share count changed by ${pct} a year on average over ${yrs} fiscal years.`,
  },
  {
    pattern: /^PER actual de\s+([\d.,]+x)\s+frente a mediana histórica de\s+([\d.,]+x):\s*([+\-−]?[\d.,]+%)\s+de diferencia\.?$/i,
    replace: (_m, cur, med, diff) =>
      `Current P/E is ${cur} vs. a historical median of ${med} (${diff} difference).`,
  },
  {
    pattern: /^El PER actual es\s+([\d.,]+x)\.\s*Al no haber una historia suficiente\s*(.*)$/i,
    replace: (_m, cur, rest) =>
      `Current P/E is ${cur}. ${rest ? translateToEnglish(rest) : "Not enough history yet for a fair historical comparison."}`,
  },
  {
    pattern: /^No hay al menos dos ejercicios comparables de\s+(.+?)\.?$/i,
    replace: (_m, what) => `At least 2 comparable years of ${translateToEnglish(what)} are needed.`,
  },
  {
    pattern: /^datos\s+(\d+)\s*\/\s*(\d+)$/i,
    replace: (_m, a, b) => `data ${a}/${b}`,
  },
  {
    pattern: /^(\d+)\s+con análisis disponible$/i,
    replace: (_m, n) => `${n} ready to explore`,
  },
  {
    pattern: /^(\d+)\s+resultados visibles\s*·\s*ordenados por claves superadas y cobertura$/i,
    replace: (_m, n) => `${n} companies shown · sorted by keys passed and data coverage`,
  },
  {
    pattern: /^El motor respondió\s+(\d+)$/i,
    replace: (_m, code) => `Data engine returned HTTP ${code}`,
  },
  {
    pattern: /^Abrir perfil de\s+(.+)$/i,
    replace: (_m, target) => `Open profile for ${target}`,
  },

  // =========================================================================
  // 3. FINANCIAL OVERVIEW CHART & STATEMENTS (financial-overview-chart.tsx / financial-table.tsx)
  // =========================================================================
  {
    pattern: /^Evolución Financiera Histórica\s*\((\d{4})\s*-\s*(\d{4})\)$/i,
    replace: (_m, y1, y2) => `Historical Financial Trend (${y1} - ${y2})`,
  },
  {
    pattern: /^(Ingresos|Beneficio Neto|Flujo Caja Libre|Margen Neto|Margen Op\.)\s*\(([^)]+)\)$/i,
    replace: (_m, metric, unit) => `${translateInnerToken(metric).replace(/^[a-z]/, (c) => c.toUpperCase())} (${translateInnerToken(unit)})`,
  },
  {
    pattern: /^Ver los últimos\s+(\d+)\s+años$/i,
    replace: (_m, n) => `Show last ${n} years`,
  },
  {
    pattern: /^Escala en\s+(.+)$/i,
    replace: (_m, unit) => `Scale in ${translateScaleWord(unit)}`,
  },
  {
    pattern: /^Quitar\s+(.+?)\s+del gráfico$/i,
    replace: (_m, item) => `Remove ${translateInnerToken(item)} from chart`,
  },
  {
    pattern: /^Integrar\s+(.+?)\s+en el gráfico superior$/i,
    replace: (_m, item) => `Add ${translateInnerToken(item)} to the main chart`,
  },
  {
    pattern: /^(.+?)\s+sin datos$/i,
    replace: (_m, item) => `${translateInnerToken(item)} has no data`,
  },
  {
    pattern: /^Abrir\s+(.+?)\s+en detalle$/i,
    replace: (_m, item) => `Open ${translateInnerToken(item)} chart`,
  },
  {
    pattern: /^Cid recorre la trayectoria financiera agregada de\s+(.+)$/i,
    replace: (_m, ticker) => `Cid is walking through ${ticker}'s overall financial track record`,
  },
  {
    pattern: /^Cid recorre la cotización de\s+(.+)$/i,
    replace: (_m, ticker) => `Cid is riding ${ticker}'s stock price history`,
  },
  {
    pattern: /^Cid recorre las barras de\s+(.+?)\s+de\s+(.+)$/i,
    replace: (_m, metric, ticker) => `Cid is walking across ${ticker}'s ${translateInnerToken(metric)} bars`,
  },
  {
    pattern: /^Trayectoria histórica\s*\((\d+)\s+periodos\)$/i,
    replace: (_m, n) => `Historical trend (${n} periods)`,
  },
  {
    pattern: /^(Miles de Millones|Millones|Miles)\s*\(([^)]+)\)$/i,
    replace: (_m, scale, unit) => `${translateScaleWord(scale).replace(/^[a-z]/, (c) => c.toUpperCase())} (${translateInnerToken(unit)})`,
  },
  {
    pattern: /^Ingresos\s+([+\-−]?[\d.,]+%)$/i,
    replace: (_m, pct) => `Revenue ${pct}`,
  },
  {
    pattern: /^Frente a\s+([^:]+):\s*(.+)$/i,
    replace: (_m, period, rest) => `Vs. ${translateInnerToken(period)}: ${translateToEnglish(rest)}`,
  },
  {
    pattern: /^(?:vs|frente a)\s+(.+)$/i,
    replace: (_m, period) => `vs. ${translateInnerToken(period)}`,
  },
  {
    pattern: /^Evolución histórica\s*·\s*cifras en\s+(.+)$/i,
    replace: (_m, unit) => `Historical trend · values in ${translateScaleWord(unit)}`,
  },
  {
    pattern: /^(Ocultar|Mostrar)\s+a\s+Cid\s+en el gráfico de\s+(.+)$/i,
    replace: (_m, verb, metric) =>
      `${verb.toLowerCase() === "ocultar" ? "Hide" : "Show"} Cid on the ${translateInnerToken(metric)} chart`,
  },
  {
    pattern: /^Gráfico de barras de\s+(.+?)(?:\s+para\s+(.+))?$/i,
    replace: (_m, metric, company) =>
      company
        ? `Bar chart of ${translateInnerToken(metric)} for ${company}`
        : `Bar chart of ${translateInnerToken(metric)}`,
  },
  {
    pattern: /^Solo 1 periodo registrado\s*\(([^)]+)\)\.?$/i,
    replace: (_m, period) => `Only 1 period on file (${translateInnerToken(period)}).`,
  },
  {
    pattern: /^Calculado sobre todos los datos registrados:\s*(.+?)\s+a\s+(.+?)\s*\((\d+)\s+periodos\)\.?$/i,
    replace: (_m, a, b, n) => `Calculated across all recorded periods: ${a} to ${b} (${n} periods).`,
  },
  {
    pattern: /^Estable\s*\(([+\-−]?[\d.,]+%)\s+anualizado\)$/i,
    replace: (_m, pct) => `Steady (${pct} annualized)`,
  },
  {
    pattern: /^Ha subido un\s+([+\-−]?[\d.,]+%)\s+anualizado$/i,
    replace: (_m, pct) => `Up ${pct} a year on average`,
  },
  {
    pattern: /^Ha bajado un\s+([+\-−]?[\d.,]+%)\s+anualizado$/i,
    replace: (_m, pct) => `Down ${pct} a year on average`,
  },
  {
    pattern: /^(\d+)\s+periodos$/i,
    replace: (_m, n) => `${n} periods`,
  },

  // =========================================================================
  // 4. DATES & FILING PROVENANCE
  // =========================================================================
  {
    pattern: /^Fuente\s+([A-Za-z0-9\-/]+)\s+presentado el\s+(.+)$/i,
    replace: (_m, form, date) => `Source: ${form} filed on ${translateSpanishDate(date)}`,
  },
  {
    pattern: /^Presentado el\s+(.+)$/i,
    replace: (_m, date) => `Filed ${translateSpanishDate(date)}`,
  },
  {
    pattern: /^Alcanzado el\s+(.+)$/i,
    replace: (_m, date) => `Reached on ${translateSpanishDate(date)}`,
  },
  {
    pattern: /^Registrado el\s+(.+)$/i,
    replace: (_m, date) => `Recorded on ${translateSpanishDate(date)}`,
  },
  {
    pattern: /^Última cotización:\s*(.+)$/i,
    replace: (_m, date) => `Latest price: ${translateSpanishDate(date)}`,
  },
  {
    pattern: /^(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})$/i,
    replace: (_m, d, m, y) => translateSpanishDate(`${d} de ${m} de ${y}`),
  },
  {
    pattern: /^(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sept?|oct|nov|dic)\.?\s+(\d{4})$/i,
    replace: (_m, d, m, y) => translateSpanishDate(`${d} ${m} ${y}`),
  },
  {
    pattern: /^(\d+)\s+caracteres analizados$/i,
    replace: (_m, n) => `${n} characters analyzed`,
  },

  // =========================================================================
  // 5. BUDGET, COMPOUND INTEREST & INFLATION
  // =========================================================================
  {
    pattern: /^Ahorro actual:\s*(.+)$/i,
    replace: (_m, val) => `Current savings: ${val}`,
  },
  {
    pattern: /^Ingreso anual:\s*(.+)$/i,
    replace: (_m, val) => `Annual income: ${val}`,
  },
  {
    pattern: /^(\d+(?:[.,]\d+)?)%\s+asignado\s*·\s*Resta un\s+(.+?)\s+por asignar$/i,
    replace: (_m, pct, rem) => `${pct}% allocated · ${rem} left to assign`,
  },
  {
    pattern: /^(\d+(?:[.,]\d+)?)%\s+asignado\s*·\s*Sobrepasa un\s+(.+)$/i,
    replace: (_m, pct, over) => `${pct}% allocated · ${over} over budget`,
  },
  {
    pattern: /^Reset\s*\((\d+(?:[.,]\d+)?)%\)$/i,
    replace: (_m, pct) => `Reset (${pct}%)`,
  },
  {
    pattern: /^Hacer clic para restablecer al recomendado\s*\((\d+(?:[.,]\d+)?)%\)$/i,
    replace: (_m, pct) => `Click to reset to recommended (${pct}%)`,
  },
  {
    pattern: /^Recomendado:\s*(\d+(?:[.,]\d+)?)%$/i,
    replace: (_m, pct) => `Suggested: ${pct}%`,
  },
  {
    pattern: /^Si inviertes estos\s+(.+?)\/mes(.*)$/i,
    replace: (_m, amt, tail) =>
      `If you invest this ${amt}/month${tail ? ` ${translateToEnglish(tail)}` : ""}`,
  },
  {
    pattern: /^Calcular con\s+(.+?)\/mes$/i,
    replace: (_m, amt) => `Calculate with ${amt}/mo`,
  },
  {
    pattern: /^Capital Final Proyectado tras\s+(\d+)\s+años$/i,
    replace: (_m, n) => `Projected Balance After ${n} Years`,
  },
  {
    pattern: /^Multiplicas por\s+([\d.,]+x)\s+el dinero aportado\s*(.*)$/i,
    replace: (_m, mult, rest) => `You multiply your contributions by ${mult}${rest ? ` ${translateToEnglish(rest)}` : ""}`,
  },
  {
    pattern: /^Conservas el\s+(\d+(?:[.,]\d+)?)%\s+del dinero aportado\s*(.*)$/i,
    replace: (_m, pct, rest) => `You keep ${pct}% of your original purchasing power${rest ? ` ${translateToEnglish(rest)}` : ""}`,
  },
  {
    pattern: /^([A-Z0-9.\-]+)\s*·\s*Histórico\s+(\d+)a$/i,
    replace: (_m, ticker, n) => `${ticker} · ${n}y History`,
  },
  {
    pattern: /^Histórico\s+(\d+)\s+años$/i,
    replace: (_m, n) => `${n}-year history`,
  },
  {
    pattern: /^El rendimiento se recalcula automáticamente según el plazo\s*\((\d+)\s+años\)$/i,
    replace: (_m, n) => `Returns automatically update based on your time horizon (${n} years)`,
  },
  {
    pattern: /^Consultando cotizaciones históricas de\s+(.+)$/i,
    replace: (_m, target) => `Loading historical prices for ${target}`,
  },
  {
    pattern: /^Rentabilidad Anualizada\s*\((\d+)\s+años\)$/i,
    replace: (_m, n) => `Annualized Return (${n} years)`,
  },
  {
    pattern: /^en\s+(\d+)\s+años$/i,
    replace: (_m, n) => `in ${n} years`,
  },
  {
    pattern: /^ℹ️\s*Esta empresa cuenta con\s+(.+)$/i,
    replace: (_m, rest) => `ℹ️ This company has ${translateToEnglish(rest)}`,
  },
  {
    pattern: /^La rentabilidad calculada refleja el comportamiento histórico de\s+(.+)$/i,
    replace: (_m, ticker) => `This return reflects the actual historical performance of ${ticker}.`,
  },
  {
    pattern: /^Año\s+(\d+)$/i,
    replace: (_m, n) => `Year ${n}`,
  },
  {
    pattern: /^(\d+)\s*a$/i,
    replace: (_m, n) => `${n}y`,
  },
  {
    pattern: /^Poder de compra real en\s+(\d+)\s+años$/i,
    replace: (_m, n) => `Real Purchasing Power in ${n} Years`,
  },
  {
    pattern: /^Pierdes\s+(.+)$/i,
    replace: (_m, val) => `You lose ${translateToEnglish(val)}`,
  },
  {
    pattern: /^Para comprar lo que hoy cuesta\s+(.+?)(?:,|\.)?$/i,
    replace: (_m, val) => `To buy what costs ${val} today,`,
  },
  {
    pattern: /^Necesitarás\s+(.+)$/i,
    replace: (_m, val) => `You'll need ${val}`,
  },
  {
    pattern: /^Invirtiendo al\s+([\d.,]+)\s*%$/i,
    replace: (_m, pct) => `Investing at ${pct}%`,
  },
  {
    pattern: /^Saldo nominal:\s*(.+)$/i,
    replace: (_m, val) => `Nominal balance: ${val}`,
  },
  {
    pattern: /^Capital inicial:\s*(.+)$/i,
    replace: (_m, val) => `Starting balance: ${val}`,
  },
  {
    pattern: /^Inversión real\s*\(([\d.,]+)\s*%\)$/i,
    replace: (_m, pct) => `Real return after inflation (${pct}%)`,
  },
  {
    pattern: /^(.+?)\s*\(Pérdida:\s*(.+)\)$/i,
    replace: (_m, val, loss) => `${val} (Loss: ${loss})`,
  },
  {
    pattern: /^(.+?)\s*\(Ganancia real:\s*(.+)\)$/i,
    replace: (_m, val, gain) => `${val} (Real gain: ${gain})`,
  },

  // =========================================================================
  // 6. MACRO, INDICES, COMMODITIES & FOREX
  // =========================================================================
  {
    pattern: /^Todos\s*\((\d+)\)$/i,
    replace: (_m, n) => `All (${n})`,
  },
  {
    pattern: /^Todas\s*\((\d+)\)$/i,
    replace: (_m, n) => `All (${n})`,
  },
  {
    pattern: /^(\d+)\s+(datos|observaciones|activos|selectivos|índices|pares oficiales)$/i,
    replace: (_m, n, label) => `${n} ${FRAGMENT_DICTIONARY[label.toLowerCase()] ?? label}`,
  },
  {
    pattern: /^(Ver|Analizar)\s+(.+)$/i,
    replace: (_m, verb, target) => `${verb.toLowerCase() === "ver" ? "View" : "Explore"} ${translateInnerToken(target)}`,
  },
  {
    pattern: /^Gráfico de\s+(.+)$/i,
    replace: (_m, metric) => `${translateInnerToken(metric)} chart`,
  },
  {
    pattern: /^Símbolo oficial:\s*(.+)$/i,
    replace: (_m, sym) => `Official ticker: ${sym}`,
  },
  {
    pattern: /^Serie oficial sincronizada con FRED\s*\(([^)]+)\)\.?$/i,
    replace: (_m, id) => `Official data series synced with FRED (${id}).`,
  },
  {
    pattern: /^Publicación estadística H\.10 del Federal Reserve Board\s*\(([^)]+)\)\.?$/i,
    replace: (_m, id) => `Federal Reserve H.10 statistical release (${id}).`,
  },
  {
    pattern: /^Cotización oficial en puntos de índice nominales\s*\(([^)]+)\)\.?$/i,
    replace: (_m, sym) => `Official level in index points (${sym}).`,
  },
  {
    pattern: /^BENCHMARK GLOBAL\s*·\s*FRED:\s*(.+)$/i,
    replace: (_m, id) => `GLOBAL BENCHMARK · FRED: ${id}`,
  },
  {
    pattern: /^Media anual\s*·\s*actual:\s*(.+)$/i,
    replace: (_m, val) => `Annual average · latest: ${val}`,
  },
  {
    pattern: /^Tipo actual\s*·\s*media en rango:\s*(.+)$/i,
    replace: (_m, val) => `Current rate · period average: ${val}`,
  },
  {
    pattern: /^Paro actual\s*·\s*media en rango:\s*(.+)$/i,
    replace: (_m, val) => `Current rate · period average: ${val}`,
  },
  {
    pattern: /^Media del periodo\s*\((\d+)\s+años\)$/i,
    replace: (_m, n) => `Period average (${n} years)`,
  },
  {
    pattern: /^([+\-−]?[\d.,]+\s*%?)\s+relativo$/i,
    replace: (_m, pct) => `${pct} relative change`,
  },

  // =========================================================================
  // 7. VALUATION, TECHNICALS, OPTIONS, COPILOT, NEWS, WATCHLIST & COMMAND PALETTE
  // =========================================================================
  {
    pattern: /^PER\s*≤\s*su mediana\s*(.*)$/i,
    replace: (_m, rest) => `P/E at or below its historical median ${translateToEnglish(rest)}`.trim(),
  },
  {
    pattern: /^Mediana\s+([\d.,]+x)$/i,
    replace: (_m, med) => `Median ${med}`,
  },
  {
    pattern: /^Base 100\s*€\/\$$/i,
    replace: () => "Indexed to 100 ($/€)",
  },
  {
    pattern: /^Ver las\s+(\d+)\s+presentaciones y sus datos de cálculo$/i,
    replace: (_m, n) => `View all ${n} official filings & math`,
  },
  {
    pattern: /^Vista trimestral no disponible:\s*(.+)$/i,
    replace: (_m, reason) => `Quarterly view unavailable: ${translateToEnglish(reason)}`,
  },
  {
    pattern: /^(\d+)\s+ej\.\s*·\s*FY\s+(\d{4})[–-](\d{4})$/i,
    replace: (_m, n, y1, y2) => `${n} yrs · FY ${y1}-${y2}`,
  },
  {
    pattern: /^Cotización actual:\s*(.+)$/i,
    replace: (_m, price) => `Current price: ${price}`,
  },
  {
    pattern: /^Mediana últimos\s+(\d+)\s+años:\s*~?([\d.,]+x)\s*·\s*(.+)$/i,
    replace: (_m, n, med, rest) => `Median (last ${n} yrs): ~${med} · ${translateToEnglish(rest)}`,
  },
  {
    pattern: /^Actual\s+([A-Za-z0-9/]+):\s*~?([\d.,]+x)$/i,
    replace: (_m, kind, val) => `Current ${kind}: ~${val}`,
  },
  {
    pattern: /^(\d+)\s+observaci(?:ón|ones)$/i,
    replace: (_m, n) => `${n} ${n === "1" ? "observation" : "observations"}`,
  },
  {
    pattern: /^([\d.,]+)\s*%\s+anual$/i,
    replace: (_m, n) => `${n}%/yr`,
  },
  {
    pattern: /^Línea Proyectada\s*\(M\s+([A-Z]{3})\)$/i,
    replace: (_m, cur) => `Projected Path (${cur} M)`,
  },
  {
    pattern: /^Precio por acción objetivo\s*\(([A-Z]{3})\)$/i,
    replace: (_m, cur) => `Target Share Price (${cur})`,
  },
  {
    pattern: /^Los estados proceden de\s+(.+)$/i,
    replace: (_m, src) => `Financial statements come from ${translateToEnglish(src)}`,
  },
  {
    pattern: /^(.+?)\s*\(Caja\)$/i,
    replace: (_m, val) => `${val} (Cash)`,
  },
  {
    pattern: /^Vol\.\s*Anualizada:\s*([\d.,]+%)$/i,
    replace: (_m, pct) => `Annualized Vol: ${pct}`,
  },
  {
    pattern: /^([+\-−]?[\d.,]+%)\s+\(Nivel\s+(\d+)\)$/i,
    replace: (_m, pct, lvl) => `${pct} (Level ${lvl})`,
  },
  {
    pattern: /^([+\-−]?[\d.,]+%)\s+desde mín\.\s+52s$/i,
    replace: (_m, pct) => `${pct} above 52w low`,
  },
  {
    pattern: /^([+\-−]?[\d.,]+%)\s+vs\s+SMA\s+(\d+)$/i,
    replace: (_m, pct, n) => `${pct} vs. SMA ${n}`,
  },
  {
    pattern: /^No hay observaciones disponibles para el rango de fechas seleccionado\s*\((.+?)\s+a\s+(.+?)\)\.?$/i,
    replace: (_m, d1, d2) => `No data points available for the selected date range (${d1} to ${d2}).`,
  },
  {
    pattern: /^Proxy compuesto\s*·\s*confianza\s+(.+)$/i,
    replace: (_m, conf) => `Composite proxy · ${translateInnerToken(conf)} confidence`,
  },
  {
    pattern: /^Rango implícito hasta\s+(.+)$/i,
    replace: (_m, date) => `Implied move through ${translateSpanishDate(date)}`,
  },
  {
    pattern: /^Spot\s+(.+)$/i,
    replace: (_m, price) => `Spot ${price}`,
  },
  {
    pattern: /^◆\s*Máximo dolor:\s*(.+)$/i,
    replace: (_m, strike) => `◆ Max pain: ${strike}`,
  },
  {
    pattern: /^(\d+)\s+contratos analizados$/i,
    replace: (_m, n) => `${n} contracts analyzed`,
  },
  {
    pattern: /^Datos de opciones no disponibles para\s+(.+)$/i,
    replace: (_m, ticker) => `Options data is unavailable for ${ticker}`,
  },
  {
    pattern: /^(\d+(?:,\d+)*)\s+puts frente a\s+(\d+(?:,\d+)*)\s+calls\s+(negociadas|abiertas)$/i,
    replace: (_m, p, c, kind) =>
      `${p} puts vs. ${c} calls (${kind.toLowerCase() === "negociadas" ? "traded" : "open interest"})`,
  },
  {
    pattern: /^Vol\/OI\s+([\d.,]+×)\s*·\s*(\d+)\s+contratos$/i,
    replace: (_m, ratio, n) => `Vol/OI ${ratio} · ${n} contracts`,
  },
  {
    pattern: /^Cobertura:\s*(.+?)\.\s*Este módulo describe posicionamiento y escenarios; no es una recomendación de inversión\.?$/i,
    replace: (_m, cov) =>
      `Coverage: ${translateInnerToken(cov)}. This view summarizes market positioning and scenarios—not investment advice.`,
  },
  {
    pattern: /^La mayor concentración de\s+(calls|puts)\s+está en\s+(.+)$/i,
    replace: (_m, side, strike) => `The largest ${side} concentration sits at ${strike}`,
  },
  {
    pattern: /^El precio de las opciones descuenta un recorrido aproximado de\s+(.+)$/i,
    replace: (_m, range) => `Options pricing currently implies a move of about ${range}`,
  },
  {
    pattern: /^(\d+)\s+contrato\(s\)\s+presenta\(n\)\s+volumen muy superior\s*(.*)$/i,
    replace: (_m, n, rest) => `${n} contract(s) show unusually high volume ${translateToEnglish(rest)}`.trim(),
  },
  {
    pattern: /^Comprobado a las\s+(.+)$/i,
    replace: (_m, time) => `Checked at ${time}`,
  },
  {
    pattern: /^([+\-−]?[\d.,]+%)\s+hoy$/i,
    replace: (_m, pct) => `${pct} today`,
  },
  {
    pattern: /^(\d+)\s+solo en seguimiento$/i,
    replace: (_m, n) => `${n} tracking only`,
  },
  {
    pattern: /^(Eliminar|Editar objetivo de|Añadir)\s+(.+?)(\s+a favoritas)?$/i,
    replace: (_m, verb, target, tail) => {
      const v = verb.toLowerCase();
      if (v === "eliminar") return `Remove ${target}`;
      if (v.startsWith("editar")) return `Edit target for ${target}`;
      return tail ? `Add ${target} to Watchlist` : `Add ${target}`;
    },
  },
  {
    pattern: /^([A-Z0-9.\-]+)\s*·\s*Lista de favoritas$/i,
    replace: (_m, ticker) => `${ticker} · Watchlist`,
  },
  {
    pattern: /^Está a\s+([+\-−]?[\d.,]+%)\s+del precio actual\.?$/i,
    replace: (_m, pct) => `${pct} away from the current price.`,
  },
  {
    pattern: /^Objetivo alcanzado\s*·\s*(.+)$/i,
    replace: (_m, ticker) => `Target reached · ${ticker}`,
  },
  {
    pattern: /^Abrir\s+([A-Z0-9.\-]+)$/i,
    replace: (_m, ticker) => `Open ${ticker}`,
  },
  {
    pattern: /^No encontramos\s+«(.+)»$/i,
    replace: (_m, q) => `No results found for "${q}"`,
  },
  {
    pattern: /^Abrir en\s+([A-Za-z0-9\s\-]+)$/i,
    replace: (_m, src) => `Open on ${src.trim()}`,
  },
  {
    pattern: /^Cuota del proveedor agotada\.\s*(.*)$/i,
    replace: (_m, msg) => `Data provider rate limit reached. ${translateToEnglish(msg)}`.trim(),
  },
  {
    pattern: /^El proveedor no reconoce el símbolo\s+(.+)\.?$/i,
    replace: (_m, sym) => `Data provider couldn't find symbol ${sym}.`,
  },
  {
    pattern: /^Extrayendo apartado\s+Item 7\s+del informe\s+([A-Za-z0-9\-/]+)\s*\(([^)]+)\)\.\.\.$/i,
    replace: (_m, form, date) => `Pulling Item 7 from the ${form} report (${translateSpanishDate(date)})...`,
  },
  {
    pattern: /^Última hora sobre\s+(.+)$/i,
    replace: (_m, name) => `Latest news for ${name}`,
  },
  {
    pattern: /^Eventos corporativos oficiales ante la SEC \(Form 8-K\) y cobertura de prensa para\s+([A-Z0-9.\-]+)\s*\((.+)\)\.?$/i,
    replace: (_m, ticker, name) => `Official SEC corporate filings (Form 8-K) and press coverage for ${ticker} (${name}).`,
  },
  {
    pattern: /^(Prensa|SEC 8-K)\s*\((\d+)\)$/i,
    replace: (_m, kind, n) => `${kind.toLowerCase() === "prensa" ? "Press" : "SEC 8-K"} (${n})`,
  },
  {
    pattern: /^Leer:\s*(.+)$/i,
    replace: (_m, title) => `Read: ${title}`,
  },
  {
    pattern: /^(\d+(?:[.,]\d+)?)\s*%\s*$/,
    replace: (_m, n) => `${n}%`,
  },
];

function preserveAllCaps(original: string, translated: string): string {
  const letters = original.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "");
  if (letters.length > 1 && letters === letters.toUpperCase() && !/\s/.test(original.trim())) {
    return translated.toUpperCase();
  }
  return translated;
}

function translateSingleSegment(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const leadingWhitespace = text.match(/^\s*/)?.[0] ?? "";
  const trailingWhitespace = text.match(/\s*$/)?.[0] ?? "";

  // 1. Exact dictionary match
  const exact = FINANCIAL_DICTIONARY[trimmed];
  if (exact) {
    return `${leadingWhitespace}${exact}${trailingWhitespace}`;
  }

  // 2. Trailing period exact match ("Texto." when "Texto" is in dictionary)
  if (trimmed.endsWith(".") && !trimmed.endsWith("...")) {
    const withoutDot = trimmed.slice(0, -1);
    const exactNoDot = FINANCIAL_DICTIONARY[withoutDot];
    if (exactNoDot) {
      const normalizedEnd = exactNoDot.endsWith(".") ? exactNoDot : `${exactNoDot}.`;
      return `${leadingWhitespace}${normalizedEnd}${trailingWhitespace}`;
    }
  }

  // 3. Trailing colon exact match ("Etiqueta:" when "Etiqueta" is in dictionary)
  if (trimmed.endsWith(":")) {
    const withoutColon = trimmed.slice(0, -1);
    const exactNoColon = FINANCIAL_DICTIONARY[withoutColon];
    if (exactNoColon) {
      const normalizedEnd = exactNoColon.endsWith(":") ? exactNoColon : `${exactNoColon}:`;
      return `${leadingWhitespace}${normalizedEnd}${trailingWhitespace}`;
    }
  }

  // 4. Case-insensitive dictionary match
  const ci = LOWERCASE_DICTIONARY.get(trimmed.toLowerCase());
  if (ci) {
    return `${leadingWhitespace}${preserveAllCaps(trimmed, ci)}${trailingWhitespace}`;
  }

  // 5. Dynamic patterns
  for (const { pattern, replace } of DYNAMIC_PATTERNS) {
    if (pattern.test(trimmed)) {
      const result = trimmed.replace(pattern, (...args) => replace(...args.map(String)));
      return `${leadingWhitespace}${result}${trailingWhitespace}`;
    }
  }

  return text;
}

export function translateToEnglish(text: string): string {
  if (!text) return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  // Try full string first (exact, punctuation-trimmed, case-insensitive, dynamic)
  const direct = translateSingleSegment(text);
  if (direct !== text) return direct;

  // Fallback for middle-dot compound labels ("Estados Unidos · USD", "3M · Últimos 3 meses")
  if (trimmed.includes(" · ")) {
    const leadingWhitespace = text.match(/^\s*/)?.[0] ?? "";
    const trailingWhitespace = text.match(/\s*$/)?.[0] ?? "";
    const parts = trimmed.split(" · ");
    let anyChanged = false;
    const translatedParts = parts.map((part) => {
      const converted = translateSingleSegment(part);
      if (converted !== part) anyChanged = true;
      return converted.trim();
    });
    if (anyChanged) {
      return `${leadingWhitespace}${translatedParts.join(" · ")}${trailingWhitespace}`;
    }
  }

  return text;
}

export function t(key: string, lang: Language): string {
  if (lang === "es") return key;
  return translateToEnglish(key);
}
