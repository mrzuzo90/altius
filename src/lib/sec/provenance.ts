/**
 * Procedencia de una cifra.
 *
 * Toda celda de Altius responde a la pregunta «¿de dónde sale este número?».
 * Hay exactamente tres respuestas posibles y ninguna más: sale de un hecho
 * publicado, lo ha calculado Altius a partir de otros hechos, o no existe.
 */

export type ReportedProvenance = {
  kind: "reported";
  /** Concepto us-gaap o dei del que procede el valor. */
  concept: string;
  /** Unidad declarada en el XBRL: USD, shares, USD/shares. */
  unit: string;
  /** Inicio del periodo. `null` en los hechos de instante (balance). */
  periodStart: string | null;
  periodEnd: string;
  /** Formulario del que procede: 10-K, 10-Q. */
  form: string;
  /** Fecha de presentación. Es lo que desempata las reexpresiones. */
  filed: string;
  /** Número de acceso de la presentación. Identifica el documento exacto. */
  accn: string;
};

export type DerivedProvenance = {
  kind: "derived";
  /** Expresión legible: "Flujo de caja de explotación − Inversión en inmovilizado". */
  formula: string;
  inputs: { label: string; value: number; source: Provenance }[];
};

export type AbsentProvenance = { kind: "absent" };

export type Provenance = ReportedProvenance | DerivedProvenance | AbsentProvenance;

export const ABSENT: AbsentProvenance = { kind: "absent" };

/**
 * URL del índice de una presentación en EDGAR.
 *
 * El CIK va SIN ceros a la izquierda en las rutas de `www.sec.gov/Archives`
 * —al contrario que en `data.sec.gov/api`, que los exige—, y el directorio del
 * filing es el número de acceso sin guiones. El fichero de índice sí los lleva.
 */
export function edgarFilingUrl(cik: string, accn: string): string {
  const cikSinCeros = String(Number.parseInt(cik, 10));
  const sinGuiones = accn.replace(/-/g, "");
  return `https://www.sec.gov/Archives/edgar/data/${cikSinCeros}/${sinGuiones}/${accn}-index.htm`;
}
