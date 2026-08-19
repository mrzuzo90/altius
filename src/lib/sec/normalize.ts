import type { CompanyFacts, XbrlFact } from "./types";
import type { LineDef } from "./taxonomy";

/**
 * Motor de normalización XBRL.
 *
 * Convierte el volcado de hechos de `companyfacts` en una rejilla de líneas por
 * periodo. Todo lo que hace este módulo existe para resolver un problema
 * concreto y verificado de los datos de la SEC; ver el comentario de cada paso.
 */

export type Frequency = "annual" | "quarterly";
export type PeriodKey = string;

export type Period = {
  key: PeriodKey;
  label: string;
  /** Fecha de cierre del periodo. */
  end: string;
  fiscalYear: number;
  quarter: number;
  /** Cierto si el periodo entero se ha derivado, como ocurre con Q4. */
  derived: boolean;
};

export type Cell = {
  value: number | null;
  /** Cierto si Altius ha calculado el valor en lugar de leerlo del informe. */
  derived: boolean;
  /** Concepto XBRL del que procede el valor. Permite auditar cada celda. */
  concept?: string;
};

export type LineSeries = { line: LineDef; cells: Record<PeriodKey, Cell> };
export type NormalizedStatement = { periods: Period[]; rows: LineSeries[] };

const DIA_MS = 86_400_000;

/** Rangos de duración en días. Verificados contra la distribución real de Apple:
 *  90/97 trimestres, 181/188 y 272/279 acumulados de 10-Q, 363/370 anuales. */
const ANUAL_MIN = 340;
const ANUAL_MAX = 380;
const TRIMESTRAL_MIN = 80;
const TRIMESTRAL_MAX = 100;

const dias = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / DIA_MS);

export type FiscalAnchor = { month: number; day: number };

/**
 * Deduce el cierre de ejercicio a partir del hecho anual más reciente.
 *
 * No se puede usar el campo `fy` de los hechos: es el ejercicio de la
 * PRESENTACIÓN, no el del hecho. El mismo periodo 2022-09→2023-09 de Apple
 * aparece con fy 2023, 2024 y 2025 según qué 10-K lo reexprese.
 */
export function fiscalYearEndAnchor(facts: CompanyFacts): FiscalAnchor {
  let ultimo: string | null = null;
  for (const conceptos of Object.values(facts.facts ?? {})) {
    for (const concepto of Object.values(conceptos)) {
      for (const unidad of Object.values(concepto.units ?? {})) {
        for (const f of unidad) {
          if (!f.start) continue;
          const d = dias(f.start, f.end);
          if (d < ANUAL_MIN || d > ANUAL_MAX) continue;
          if (!ultimo || f.end > ultimo) ultimo = f.end;
        }
      }
    }
  }
  if (!ultimo) return { month: 12, day: 31 };
  const d = new Date(`${ultimo}T00:00:00Z`);
  return { month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/**
 * Asigna una fecha de cierre a (ejercicio, trimestre).
 *
 * Se elige el aniversario del cierre de ejercicio más cercano por delante,
 * admitiendo hasta 20 días de retraso. Esa holgura absorbe el desplazamiento de
 * los calendarios de 52/53 semanas: el ejercicio 2022 de JNJ cerró el 1 de enero
 * de 2023, y el de 2023 el 31 de diciembre.
 */
export function classifyPeriod(end: string, ancla: FiscalAnchor): { fiscalYear: number; quarter: number } {
  const fin = Date.parse(`${end}T00:00:00Z`);
  const anio = new Date(fin).getUTCFullYear();

  let elegido: { anio: number; delta: number } | null = null;
  for (const y of [anio - 1, anio, anio + 1]) {
    const aniversario = Date.UTC(y, ancla.month - 1, ancla.day);
    const delta = Math.round((aniversario - fin) / DIA_MS);
    if (delta < -20) continue;
    if (!elegido || delta < elegido.delta) elegido = { anio: y, delta };
  }
  if (!elegido) elegido = { anio, delta: 0 };

  const mesesRestantes = Math.round(elegido.delta / 30.44);
  const quarter = Math.min(4, Math.max(1, 4 - Math.round(mesesRestantes / 3)));
  return { fiscalYear: elegido.anio, quarter };
}

const claveDe = (freq: Frequency, fy: number, q: number): PeriodKey =>
  freq === "annual" ? `FY${fy}` : `${fy}Q${q}`;

const etiquetaDe = (freq: Frequency, fy: number, q: number): string =>
  freq === "annual" ? `FY ${fy}` : `Q${q} ${fy}`;

type Resuelto = { value: number; end: string; filed: string; concept: string };

/**
 * Recolecta los hechos de un concepto, ya filtrados y deduplicados.
 *
 * El dedupe es indispensable: el ingreso anual de 2023 de Apple aparece en tres
 * 10-K distintos. Gana siempre el de fecha de presentación más reciente, que es
 * el valor vigente según la propia empresa tras cualquier reexpresión.
 */
function recolectar(
  facts: CompanyFacts,
  concepto: string,
  linea: LineDef,
  freq: Frequency,
  ancla: FiscalAnchor,
): Map<PeriodKey, Resuelto> {
  const salida = new Map<PeriodKey, Resuelto>();
  const gaap = facts.facts?.["us-gaap"]?.[concepto] ?? facts.facts?.["dei"]?.[concepto];
  const hechos: XbrlFact[] | undefined = gaap?.units?.[linea.unit];
  if (!hechos) return salida;

  for (const f of hechos) {
    if (linea.kind === "instant") {
      // Un instante no tiene fecha de inicio. Si la tiene, es un flujo.
      if (f.start) continue;
    } else {
      if (!f.start) continue;
      const d = dias(f.start, f.end);
      const ok =
        freq === "annual"
          ? d >= ANUAL_MIN && d <= ANUAL_MAX
          : d >= TRIMESTRAL_MIN && d <= TRIMESTRAL_MAX;
      // Aquí caen los acumulados de seis y nueve meses que traen los 10-Q.
      if (!ok) continue;
    }

    const { fiscalYear, quarter } = classifyPeriod(f.end, ancla);
    // En la vista anual, del balance solo interesa la foto del cierre.
    if (freq === "annual" && linea.kind === "instant" && quarter !== 4) continue;

    const key = claveDe(freq, fiscalYear, quarter);
    const previo = salida.get(key);
    if (previo && previo.filed >= f.filed) continue;
    salida.set(key, { value: f.val, end: f.end, filed: f.filed, concept: concepto });
  }
  return salida;
}

function derivarQ4(
  bruto: Map<PeriodKey, Resuelto>,
  anual: Map<PeriodKey, Resuelto>,
): Map<PeriodKey, Resuelto> {
  const salida = new Map(bruto);
  const ejercicios = new Set(
    [...anual.keys()].map((k) => Number.parseInt(k.replace("FY", ""), 10)),
  );
  for (const fy of ejercicios) {
    const claveQ4 = `${fy}Q4`;
    if (salida.has(claveQ4)) continue;
    const total = anual.get(`FY${fy}`);
    const q1 = bruto.get(`${fy}Q1`);
    const q2 = bruto.get(`${fy}Q2`);
    const q3 = bruto.get(`${fy}Q3`);
    // Sin los cuatro componentes no hay resta posible, y estimar sería inventar.
    if (!total || !q1 || !q2 || !q3) continue;
    salida.set(claveQ4, {
      value: total.value - q1.value - q2.value - q3.value,
      end: total.end,
      filed: total.filed,
      concept: total.concept,
    });
  }
  return salida;
}

export function normalizeStatement(
  facts: CompanyFacts,
  lines: LineDef[],
  freq: Frequency,
  maxPeriods = 10,
): NormalizedStatement {
  const ancla = fiscalYearEndAnchor(facts);

  /** Valores brutos por línea y periodo, antes de signos y cálculos. */
  const porLinea = new Map<string, Map<PeriodKey, Resuelto>>();
  /** Periodos derivados (Q4) por línea, para marcarlos en la interfaz. */
  const derivados = new Map<string, Set<PeriodKey>>();
  const finPorPeriodo = new Map<PeriodKey, { end: string; fy: number; q: number }>();

  for (const linea of lines) {
    const acumulado = new Map<PeriodKey, Resuelto>();
    const derivadosLinea = new Set<PeriodKey>();

    // Resolución de alias POR PERIODO: se recorren los candidatos en orden y el
    // primero que tenga dato para ese periodo concreto gana. Así el histórico se
    // cose entre conceptos sin cortarse cuando la empresa cambia de etiqueta.
    for (const concepto of linea.concepts) {
      for (const [key, r] of recolectar(facts, concepto, linea, freq, ancla)) {
        if (!acumulado.has(key)) acumulado.set(key, r);
      }
    }

    // Q4 solo tiene sentido en flujos: el balance del cierre sí se reporta.
    if (freq === "quarterly" && linea.kind === "duration" && linea.concepts.length > 0) {
      const anual = new Map<PeriodKey, Resuelto>();
      for (const concepto of linea.concepts) {
        for (const [key, r] of recolectar(facts, concepto, linea, "annual", ancla)) {
          if (!anual.has(key)) anual.set(key, r);
        }
      }
      const conQ4 = derivarQ4(acumulado, anual);
      for (const key of conQ4.keys()) if (!acumulado.has(key)) derivadosLinea.add(key);
      for (const [k, v] of conQ4) acumulado.set(k, v);
    }

    porLinea.set(linea.id, acumulado);
    derivados.set(linea.id, derivadosLinea);
    for (const [key, r] of acumulado) {
      if (!finPorPeriodo.has(key) || r.end > finPorPeriodo.get(key)!.end) {
        const [fy, q] = freq === "annual"
          ? [Number.parseInt(key.replace("FY", ""), 10), 4]
          : key.split("Q").map(Number);
        finPorPeriodo.set(key, { end: r.end, fy, q });
      }
    }
  }

  const periods: Period[] = [...finPorPeriodo.entries()]
    .map(([key, v]) => ({
      key,
      label: etiquetaDe(freq, v.fy, v.q),
      end: v.end,
      fiscalYear: v.fy,
      quarter: v.q,
      derived: false,
    }))
    .sort((a, b) => (a.end < b.end ? 1 : a.end > b.end ? -1 : 0))
    .slice(0, maxPeriods);

  const enRango = new Set(periods.map((p) => p.key));
  const leer = (id: string, key: PeriodKey): number | null =>
    porLinea.get(id)?.get(key)?.value ?? null;

  const rows: LineSeries[] = lines.map((linea) => {
    const cells: Record<PeriodKey, Cell> = {};
    const brutos = porLinea.get(linea.id) ?? new Map();
    const derivadosLinea = derivados.get(linea.id) ?? new Set();

    for (const p of periods) {
      let value = brutos.get(p.key)?.value ?? null;
      let concept = brutos.get(p.key)?.concept;
      let derived = derivadosLinea.has(p.key);

      // Las dos únicas magnitudes que Altius calcula, y solo cuando la empresa
      // no las publica o cuando por definición no existen en el informe.
      if (value === null && linea.computed === "grossProfit") {
        const ingresos = leer("revenue", p.key);
        const coste = leer("costOfRevenue", p.key);
        if (ingresos !== null && coste !== null) {
          value = ingresos - coste;
          derived = true;
          concept = undefined;
        }
      }
      if (linea.computed === "freeCashFlow") {
        const cfo = leer("operatingCashFlow", p.key);
        const capex = leer("capex", p.key);
        if (cfo !== null && capex !== null) {
          value = cfo - capex;
          derived = true;
          concept = undefined;
        }
      }

      if (value !== null && linea.negate) value = -value;
      cells[p.key] = { value, derived, concept };
    }
    return { line: linea, cells };
  });

  void enRango;
  return { periods, rows };
}
