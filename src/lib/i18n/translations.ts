/**
 * Diccionario financiero profesional para traducción instantánea Español <-> Inglés.
 *
 * Utiliza terminología estándar de banca de inversión, análisis fundamental
 * y finanzas corporativas (Wall Street / CFA Institute / SEC EDGAR standard),
 * evitando traducciones literales o toscas del español.
 */

export type Language = "es" | "en";

export const FINANCIAL_DICTIONARY: Record<string, string> = {
  // --- NAVEGACIÓN Y CABECERA ---
  "Observatorio": "Overview",
  "Presupuesto": "Budget",
  "Índices": "Indices",
  "Materias Primas": "Commodities",
  "Divisas": "Currencies",
  "Macro": "Macro",
  "Favoritas": "Watchlist",
  "Mis acciones favoritas": "My Watchlist",
  "Buscar empresa": "Search company",
  "Buscar empresa, ticker o ETF": "Search company, ticker, or ETF",
  "Buscar empresa, ticker o ETF...": "Search company, ticker, or ETF...",
  "Buscar cotizada, índice, divisa o materia prima": "Search stock, index, currency, or commodity",
  "Escribe al menos dos caracteres para buscar...": "Type at least two characters to search...",
  "Sin resultados para": "No results found for",
  "Resultados para": "Results for",
  "Modo claro": "Light mode",
  "Modo oscuro": "Dark mode",
  "Activar modo claro": "Switch to light mode",
  "Activar modo oscuro": "Switch to dark mode",

  // --- SECCIONES Y PESTAÑAS DE EMPRESA ---
  "Perfil": "Overview",
  "Estados financieros": "Financial Statements",
  "Valoración": "Valuation",
  "Análisis técnico": "Technical Analysis",
  "Copiloto": "Copilot",
  "Cotización histórica": "Stock Price History",
  "Análisis fundamental": "Fundamental Analysis",
  "Evolución histórica agregada": "Historical Financial Trends",
  "Evolución histórica": "Historical Evolution",
  "Las seis claves": "The 6 Quality Keys",
  "Cuenta de resultados": "Income Statement",
  "Balance de situación": "Balance Sheet",
  "Flujo de caja": "Cash Flow Statement",
  "Ratios y márgenes": "Ratios & Margins",
  "Múltiplos y Valoración": "Multiples & Valuation",
  "Calculadora de proyecciones": "Projection Calculator",
  "Panel de auditoría": "Audit Panel",

  // --- CUENTA DE RESULTADOS (INCOME STATEMENT) ---
  "Ingresos": "Revenue",
  "Coste de ventas": "Cost of Goods Sold (COGS)",
  "Beneficio bruto": "Gross Profit",
  "Investigación y desarrollo": "Research & Development (R&D)",
  "Gastos generales, comerciales y administrativos": "Selling, General & Administrative (SG&A)",
  "Total gastos de explotación": "Total Operating Expenses",
  "Resultado de explotación": "Operating Income (EBIT)",
  "Gasto financiero": "Interest Expense",
  "Otros resultados no de explotación": "Non-Operating Income / (Expense)",
  "Resultado antes de impuestos": "Pretax Income (EBT)",
  "Impuesto sobre beneficios": "Income Tax Provision",
  "Resultado neto": "Net Income",
  "BPA básico": "Basic EPS",
  "BPA diluido": "Diluted EPS",
  "Acciones diluidas medias": "Diluted Weighted Average Shares",

  // --- BALANCE DE SITUACIÓN (BALANCE SHEET) ---
  "Efectivo y equivalentes": "Cash & Cash Equivalents",
  "Inversiones a corto plazo": "Short-Term Investments",
  "Efectivo e inversiones a corto plazo": "Cash & Short-Term Investments",
  "Deudores comerciales": "Accounts Receivable",
  "Existencias": "Inventories",
  "Activo corriente": "Total Current Assets",
  "Inmovilizado material neto": "Net Property, Plant & Equipment (PP&E)",
  "Fondo de comercio": "Goodwill",
  "Otros intangibles": "Other Intangible Assets",
  "Total activo": "Total Assets",
  "Acreedores comerciales": "Accounts Payable",
  "Deuda a corto plazo": "Short-Term Debt & Current Maturities",
  "Pasivo corriente": "Total Current Liabilities",
  "Deuda a largo plazo": "Long-Term Debt",
  "Deuda financiera total": "Total Debt",
  "Deuda financiera neta": "Net Debt",
  "Total pasivo": "Total Liabilities",
  "Participaciones rescatables": "Redeemable Non-Controlling Interest",
  "Patrimonio temporal de la dominante": "Temporary Equity",
  "Reservas acumuladas": "Retained Earnings",
  "Patrimonio de la dominante": "Stockholders' Equity",
  "Intereses minoritarios": "Minority Interest",
  "Patrimonio neto total": "Total Stockholders' Equity",
  "Total pasivo y patrimonio neto": "Total Liabilities & Equity",
  "Acciones en circulación": "Shares Outstanding",

  // --- ESTADO DE FLUJOS DE CAJA (CASH FLOW STATEMENT) ---
  "Flujo de caja de explotación": "Cash Flow from Operations (CFO)",
  "Amortizaciones": "Depreciation & Amortization",
  "Retribución en acciones": "Stock-Based Compensation",
  "Inversión en inmovilizado": "Capital Expenditures (CapEx)",
  "Flujo de caja de inversión": "Cash Flow from Investing",
  "Dividendos pagados": "Dividends Paid",
  "Recompra de acciones": "Share Repurchases (Buybacks)",
  "Flujo de caja de financiación": "Cash Flow from Financing",
  "Flujo de caja libre": "Free Cash Flow (FCF)",

  // --- RATIOS Y MÁRGENES ---
  "Margen bruto": "Gross Margin",
  "EBITDA": "EBITDA",
  "Margen EBITDA": "EBITDA Margin",
  "Margen operativo (EBIT)": "Operating Margin (EBIT)",
  "Margen operativo": "Operating Margin",
  "Margen neto": "Net Margin",
  "Margen FCF": "Free Cash Flow Margin",
  "Rentabilidad sobre patrimonio (ROE)": "Return on Equity (ROE)",
  "Rentabilidad sobre activos (ROA)": "Return on Assets (ROA)",
  "Retorno sobre capital invertido (ROIC)": "Return on Invested Capital (ROIC)",
  "Tipo impositivo efectivo": "Effective Tax Rate",
  "Conversión de EBITDA en FCF": "EBITDA to FCF Conversion",
  "Crecimiento de ingresos YoY": "Revenue Growth (YoY)",
  "Crecimiento de BPA diluido YoY": "Diluted EPS Growth (YoY)",
  "Crecimiento de FCF YoY": "Free Cash Flow Growth (YoY)",

  // --- LAS SEIS CLAVES (QUALITY SCORECARD) ---
  "Criterios cumplidos": "Criteria Met",
  "Cobertura": "Coverage",
  "Cómo se calcula": "Methodology",
  "Crecimiento duradero": "Durable Growth",
  "Rentabilidad del capital": "Capital Efficiency (ROIC)",
  "Beneficio convertido en caja": "Cash Conversion",
  "Balance resistente": "Balance Sheet Health",
  "Disciplina por acción": "Per-Share Discipline",
  "Precio con margen": "Valuation Multiple",
  "Por qué cumple": "Why it passes",
  "Qué vigilar": "What to monitor",
  "Qué no cumple": "Why it fails",
  "Sin dato": "No data",
  "PASA": "PASS",
  "VIGILAR": "MONITOR",
  "NO PASA": "FAIL",
  "SIN DATO": "NO DATA",
  "Caja neta": "Net cash",
  "Deuda neta": "Net debt",

  // Criterios de Las Seis Claves
  "Ingresos y beneficio ≥ 5 % CAGR": "Revenue & Earnings ≥ 5% CAGR",
  "ROIC mediano ≥ 12 %": "Median ROIC ≥ 12%",
  "CFO/beneficio ≥ 90 % y FCF recurrente": "CFO/Net Income ≥ 90% & Recurring FCF",
  "Caja neta o deuda neta ≤ 2x EBITDA": "Net cash or Net Debt ≤ 2x EBITDA",
  "Acciones estables o decrecientes": "Flat or Decreasing Share Count",
  "PER ≤ su mediana histórica": "P/E ≤ Historical Median",

  // Descripciones de Las Seis Claves
  "Comprueba que ventas y beneficio por acción crezcan juntos durante varios años.":
    "Verifies that revenue and earnings per share expand sustainably together over multi-year cycles.",
  "Mide cuánto beneficio genera la empresa con el capital que necesita para operar.":
    "Measures how effectively the company earns profit on the capital deployed in operations.",
  "Verifica que el beneficio contable termine convirtiéndose en caja real.":
    "Ensures accounting net income reliably converts into real free cash flow.",
  "Evalúa si la deuda y la liquidez permiten resistir años difíciles.":
    "Assesses whether liquidity and debt structure provide durability through downturns.",
  "Comprueba que el crecimiento no se pierda al emitir demasiadas acciones.":
    "Ensures earnings growth isn't diluted away by excessive share issuance or stock compensation.",
  "Compara el PER actual con la valoración habitual de la propia empresa.":
    "Compares current price-to-earnings against the company's historical valuation multiples.",
  "El análisis compara tendencias de varios ejercicios en crecimiento, retorno sobre capital, caja, balance, disciplina por acción y valoración. Un dato ausente se identifica como tal y nunca se inventa.":
    "The analysis evaluates multi-year trends across growth, return on capital, cash conversion, leverage, share count discipline, and historical valuation. Missing data is transparently noted and never fabricated.",

  // --- CONTROLES DE GRÁFICOS Y CID ---
  "Activar Cid": "Enable Cid",
  "Desactivar Cid": "Disable Cid",
  "Cid activado": "Cid Enabled",
  "Cid desactivado": "Cid Disabled",
  "Movimiento de Cid": "Cid Motion",
  "Animación de Cid": "Cid Animation",
  "Métricas mostradas": "Visible Metrics",
  "Restablecer": "Reset",
  "Horizonte": "Timeframe",
  "3 años": "3 Years",
  "5 años": "5 Years",
  "10 años": "10 Years",
  "Últimos 3 años": "Last 3 Years",
  "Últimos 5 años": "Last 5 Years",
  "Últimos 10 años": "Last 10 Years",
  "Todo el histórico": "Full History",
  "Todo": "All",
  "Escala": "Scale",
  "Frecuencia": "Frequency",
  "Anual": "Annual",
  "Trimestral": "Quarterly",
  "Ver gráfico": "View Chart",
  "Ocultar gráfico": "Hide Chart",
  "Descargar CSV": "Export CSV",
  "Copiar enlace": "Copy Link",
  "Autosuma de métricas": "Combined Metric Trends",

  // --- GRÁFICO DE COTIZACIÓN ---
  "Precio": "Price",
  "Volumen": "Volume",
  "Apertura": "Open",
  "Cierre": "Close",
  "Máximo": "High",
  "Mínimo": "Low",
  "Rentabilidad anualizada": "Annualized Return",
  "Rentabilidad acumulada": "Cumulative Return",
  "CAGR 1 año": "1-Year CAGR",
  "CAGR 5 años": "5-Year CAGR",
  "CAGR 10 años": "10-Year CAGR",
  "Diario": "Daily",
  "Semanal": "Weekly",
  "Mensual": "Monthly",
  "1 año": "1 Year",

  // --- FUENTES Y PROCEDENCIA ---
  "Fuente regulatoria": "Regulatory Source",
  "Informe anual oficial": "Official Annual Report",
  "Hechos XBRL US-GAAP o IFRS publicados en SEC EDGAR; se conserva la última reexpresión.":
    "US-GAAP or IFRS XBRL facts filed with SEC EDGAR; latest restatements preserved.",
  "Último ejercicio": "Latest Fiscal Year",
  "Hechos XBRL": "XBRL Facts",
  "Datos estructurados": "Structured Data",
  "Concepto XBRL": "XBRL Concept",
  "Presentado el": "Filed on",
  "Formulario": "Filing Form",
  "Periodo": "Period",
  "Unidad": "Unit",
  "Valor reportado": "Reported Value",
  "Valor calculado": "Calculated Value",
  "Cerrar": "Close",

  // --- VALORACIÓN Y MÚLTIPLOS ---
  "PER histórico": "Historical P/E",
  "Mediana histórica": "Historical Median",
  "Mínimo histórico": "Historical Low",
  "Máximo histórico": "Historical High",
  "PER de salida": "Exit P/E",
  "Tasa de descuento": "Discount Rate",
  "Rendimiento anual estimado": "Estimated Annual Return",
  "Margen de seguridad": "Margin of Safety",
  "Valor intrínseco": "Intrinsic Value",
  "Rentabilidad por dividendo": "Dividend Yield",

  // --- WATCHLIST & FAVORITAS ---
  "Mis favoritas": "My Watchlist",
  "Añadir a favoritas": "Add to Watchlist",
  "En favoritas": "In Watchlist",
  "Quitar de favoritas": "Remove from Watchlist",
  "No tienes empresas guardadas aún": "No companies added to your watchlist yet",

  // --- PAÍSES Y MERCADOS ---
  "Sin clasificar": "Unclassified",
  "Mercado europeo": "European Market",
  "Empresa cotizada · SEC": "Public Company · SEC",
  "Índice bursátil": "Stock Market Index",
  "Materia prima": "Commodity",
  "Divisa · Forex": "Currency · Forex",
  "Estados Unidos": "United States",
  "España": "Spain",
  "Alemania": "Germany",
  "Francia": "France",
  "Países Bajos": "Netherlands",
  "Reino Unido": "United Kingdom",
  "Suiza": "Switzerland",
  "Finlandia": "Finland",
  "Taiwán": "Taiwan",
  "Canadá": "Canada",
  "Australia": "Australia",

  // --- PIE DE PÁGINA ---
  "Cada cifra procede de un documento público. Si una empresa no reporta un concepto, aquí aparece una raya en lugar de un número inventado.":
    "Every figure originates from an audited public filing. If a company does not report a concept, a dash is shown instead of a fabricated estimate.",
  "Datos regulatorios oficiales obtenidos de SEC EDGAR y filings ESEF.":
    "Official regulatory disclosures sourced from SEC EDGAR and ESEF filings.",
  "No constituye asesoramiento financiero ni recomendación de inversión.":
    "For research purposes only. Not financial advice or an investment recommendation.",
  "Todos los derechos reservados.": "All rights reserved.",
};

/**
 * Patrones dinámicos con expresiones regulares para transformar frases variables
 * (números, porcentajes, múltiplos, fechas, coberturas) en inglés financiero pulido.
 */
interface DynamicPattern {
  regex: RegExp;
  replace: (match: string, ...groups: string[]) => string;
}

const MONTH_NAMES_ES_TO_EN: Record<string, string> = {
  enero: "January",
  febrero: "February",
  marzo: "March",
  abril: "April",
  mayo: "May",
  junio: "June",
  julio: "July",
  agosto: "August",
  septiembre: "September",
  octubre: "October",
  noviembre: "November",
  diciembre: "December",
};

export const DYNAMIC_PATTERNS: DynamicPattern[] = [
  // Cobertura X/6 -> Coverage X/6
  {
    regex: /^Cobertura\s+(\d+\/\d+)$/i,
    replace: (_, cov) => `Coverage ${cov}`,
  },
  // X de Y claves cumplen el criterio cuantitativo.
  {
    regex: /^(\d+)\s+de\s+(\d+)\s+claves\s+cumplen\s+el\s+criterio\s+cuantitativo\.(.*)$/i,
    replace: (_, score, max, rest) => {
      let extra = rest;
      extra = extra.replace(/Falta 1 clave por datos no comparables\./i, "1 key lacks comparable historical data.");
      extra = extra.replace(/Faltan (\d+) claves por datos no comparables\./i, "$1 keys lack comparable historical data.");
      extra = extra.replace(/Las seis claves tienen datos comparables\./i, "All 6 keys have comparable historical data.");
      return `${score} of ${max} keys meet the quantitative criteria.${extra}`;
    },
  },
  // "Falta 1 clave por datos no comparables."
  {
    regex: /^Falta 1 clave por datos no comparables\.$/i,
    replace: () => "1 key lacks comparable historical data.",
  },
  // "Faltan X claves por datos no comparables."
  {
    regex: /^Faltan (\d+) claves por datos no comparables\.$/i,
    replace: (_, count) => `${count} keys lack comparable historical data.`,
  },
  // "Las seis claves tienen datos comparables."
  {
    regex: /^Las seis claves tienen datos comparables\.$/i,
    replace: () => "All 6 keys have comparable historical data.",
  },
  // "No hay datos comparables suficientes para evaluar las claves."
  {
    regex: /^No hay datos comparables suficientes para evaluar las claves\.$/i,
    replace: () => "Insufficient comparable data to evaluate the scorecard keys.",
  },
  // Scorecard item observation: "ingresos +5.2 %" o "ingresos -1.9 %"
  {
    regex: /^ingresos\s+([+-]?\d+(?:\.\d+)?)\s*%/i,
    replace: (_, val) => `Revenue ${val}%`,
  },
  // Scorecard item observation: "beneficio +5.2 %"
  {
    regex: /^beneficio\s+([+-]?\d+(?:\.\d+)?)\s*%/i,
    replace: (_, val) => `Net income ${val}%`,
  },
  // Scorecard item observation: "Acciones +0.7 % anual"
  {
    regex: /^Acciones\s+([+-]?\d+(?:\.\d+)?)\s*%\s*anual$/i,
    replace: (_, val) => `Shares ${val}% annualized`,
  },
  // Scorecard item observation: "CFO/beneficio 118 % · FCF positivo 5/5"
  {
    regex: /^CFO\/beneficio\s+(\d+(?:\.\d+)?)\s*%\s*·\s*FCF\s+positivo\s+(\d+\/\d+)$/i,
    replace: (_, ratio, fcf) => `CFO/Net Income ${ratio}% · Positive FCF ${fcf}`,
  },
  // Scorecard item observation: "ROIC 9.0 %"
  {
    regex: /^ROIC\s+([+-]?\d+(?:\.\d+)?)\s*%$/i,
    replace: (_, val) => `ROIC ${val}%`,
  },
  // Scorecard item observation: "PER 67.8x · +272 % vs historia"
  {
    regex: /^PER\s+([0-9.]+x)\s*·\s*([+-]?[0-9.]+)\s*%\s*vs\s+historia$/i,
    replace: (_, pe, diff) => `P/E ${pe} · ${diff}% vs history`,
  },
  // Fechas: "Presentado el 15 de marzo de 2026"
  {
    regex: /Presentado el (\d{1,2}) de ([a-záéíóúñ]+) de (\d{4})/i,
    replace: (_, day, month, year) => {
      const m = MONTH_NAMES_ES_TO_EN[month.toLowerCase()] || month;
      return `Filed on ${m} ${day}, ${year}`;
    },
  },
  // Fechas generales "15 de marzo de 2026"
  {
    regex: /^(\d{1,2}) de ([a-záéíóúñ]+) de (\d{4})$/i,
    replace: (_, day, month, year) => {
      const m = MONTH_NAMES_ES_TO_EN[month.toLowerCase()] || month;
      return `${m} ${day}, ${year}`;
    },
  },
  // Unidades de dinero español: "19.889 M€" -> "€19.889M", "394.328 M$" -> "$394.328M"
  {
    regex: /([\d,.]+)\s*M€/g,
    replace: (_, num) => `€${num}M`,
  },
  {
    regex: /([\d,.]+)\s*M\$/g,
    replace: (_, num) => `$${num}M`,
  },
  {
    regex: /([\d,.]+)\s*B€/g,
    replace: (_, num) => `€${num}B`,
  },
  {
    regex: /([\d,.]+)\s*B\$/g,
    replace: (_, num) => `$${num}B`,
  },
  // "Últimos X años"
  {
    regex: /^Últimos\s+(\d+)\s+años$/i,
    replace: (_, years) => `Last ${years} Years`,
  },
  // "X años"
  {
    regex: /^(\d+)\s+años$/i,
    replace: (_, years) => `${years} Years`,
  },
  // "X trimestres"
  {
    regex: /^(\d+)\s+trimestres$/i,
    replace: (_, q) => `${q} Quarters`,
  },
];

/**
 * Traduce un texto en español a inglés utilizando el diccionario exacto o patrones dinámicos.
 * Si no hay correspondencia directa, conserva el texto intacto (números, códigos, tickers, nombres propios).
 */
export function translateToEnglish(text: string): string {
  if (!text) return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  // 1. Coincidencia exacta de diccionario
  if (FINANCIAL_DICTIONARY[trimmed]) {
    const translated = FINANCIAL_DICTIONARY[trimmed];
    // Conserva espacios iniciales o finales si los había
    const leadingSpaces = text.match(/^\s*/)?.[0] ?? "";
    const trailingSpaces = text.match(/\s*$/)?.[0] ?? "";
    return leadingSpaces + translated + trailingSpaces;
  }

  // 2. Coincidencia por patrones dinámicos (expresiones regulares)
  for (const pattern of DYNAMIC_PATTERNS) {
    if (pattern.regex.test(trimmed)) {
      const translated = trimmed.replace(pattern.regex, (match, ...groups) =>
        pattern.replace(match, ...groups.map((g) => (typeof g === "string" ? g : String(g))))
      );
      const leadingSpaces = text.match(/^\s*/)?.[0] ?? "";
      const trailingSpaces = text.match(/\s*$/)?.[0] ?? "";
      return leadingSpaces + translated + trailingSpaces;
    }
  }

  return text;
}

/**
 * Helper de traducción según el idioma activo
 */
export function t(key: string, lang: Language): string {
  if (lang === "es") return key;
  return translateToEnglish(key);
}
