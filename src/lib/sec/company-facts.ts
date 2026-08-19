import { padCik, secFetchJson } from "./client";
import { TTL } from "@/lib/cache/store";
import type { CompanyFacts } from "./types";

/**
 * Descarga el volcado completo de hechos XBRL de una empresa.
 *
 * Son entre 3 y 5 MB por empresa. Se descarga entero a propósito: es la única
 * forma de resolver los alias de conceptos sin encadenar decenas de peticiones,
 * porque no se sabe qué etiqueta usa cada empresa hasta haberlas mirado todas.
 */
export function getCompanyFacts(cik: string): Promise<CompanyFacts> {
  return secFetchJson<CompanyFacts>(
    `https://data.sec.gov/api/xbrl/companyfacts/CIK${padCik(cik)}.json`,
    TTL.companyFacts,
  );
}
