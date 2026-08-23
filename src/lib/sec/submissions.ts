import { padCik, secFetchJson, trimCik } from "./client";
import { TTL } from "@/lib/cache/store";
import type { CompanyProfile, FilingRef } from "./types";

export type RawSubmissions = {
  cik: string;
  name: string;
  sic: string;
  sicDescription: string;
  tickers: string[];
  exchanges: string[];
  fiscalYearEnd?: string;
  website?: string;
  description?: string;
  stateOfIncorporation?: string;
  addresses?: {
    business?: {
      street1?: string | null;
      street2?: string | null;
      city?: string | null;
      stateOrCountry?: string | null;
      zipCode?: string | null;
    };
  };
  filings: {
    /** Arrays paralelos, no array de objetos: hay que transponerlos. */
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      reportDate: string[];
      form: string[];
      primaryDocument: string[];
    };
  };
};

/**
 * Divisiones oficiales de la clasificación SIC. No es una taxonomía sectorial
 * moderna, pero es la que la propia SEC asigna a cada registrante, así que es
 * verificable y no inventada.
 */
const DIVISIONES: [number, number, string][] = [
  [100, 999, "Agricultura, silvicultura y pesca"],
  [1000, 1499, "Minería"],
  [1500, 1799, "Construcción"],
  [2000, 3999, "Manufactura"],
  [4000, 4999, "Transporte y servicios públicos"],
  [5000, 5199, "Comercio mayorista"],
  [5200, 5999, "Comercio minorista"],
  [6000, 6799, "Finanzas, seguros e inmobiliario"],
  [7000, 8999, "Servicios"],
  [9100, 9729, "Administración pública"],
];

export function sectorFromSic(sic: string): string {
  const n = Number.parseInt(sic, 10);
  if (!Number.isFinite(n)) return "No clasificado";
  for (const [lo, hi, nombre] of DIVISIONES) {
    if (n >= lo && n <= hi) return nombre;
  }
  return "No clasificado";
}

const limpiar = (v: string | null | undefined): string | null => {
  const t = v?.trim();
  return t ? t : null;
};

export function buildProfile(raw: RawSubmissions): CompanyProfile {
  const b = raw.addresses?.business;
  const address =
    limpiar(
      [
        [b?.street1, b?.street2].filter(Boolean).join(" "),
        b?.city,
        [b?.stateOrCountry, b?.zipCode].filter(Boolean).join(" "),
      ]
        .filter((part) => part && part.trim())
        .join(", "),
    ) ?? null;

  return {
    cik: padCik(raw.cik),
    name: raw.name,
    tickers: raw.tickers ?? [],
    exchanges: raw.exchanges ?? [],
    sic: raw.sic ?? "",
    sicDescription: raw.sicDescription ?? "",
    sector: sectorFromSic(raw.sic ?? ""),
    fiscalYearEnd: limpiar(raw.fiscalYearEnd),
    website: limpiar(raw.website),
    address,
    stateOfIncorporation: limpiar(raw.stateOfIncorporation),
  };
}

export function pickLatestFiling(raw: RawSubmissions, forms: string[]): FilingRef | null {
  const r = raw.filings?.recent;
  if (!r) return null;
  const buscados = new Set(forms.map((f) => f.toUpperCase()));

  let mejor: FilingRef | null = null;
  for (let i = 0; i < r.form.length; i++) {
    if (!buscados.has(r.form[i]?.toUpperCase())) continue;
    const filingDate = r.filingDate[i];
    if (mejor && filingDate <= mejor.filingDate) continue;

    const accessionNumber = r.accessionNumber[i];
    mejor = {
      form: r.form[i],
      accessionNumber,
      filingDate,
      reportDate: r.reportDate[i],
      primaryDocument: r.primaryDocument[i],
      // CIK sin ceros a la izquierda y accession sin guiones: así lo exige
      // la ruta de Archives, al contrario que las rutas del API.
      documentUrl:
        `https://www.sec.gov/Archives/edgar/data/${trimCik(raw.cik)}/` +
        `${accessionNumber.replace(/-/g, "")}/${r.primaryDocument[i]}`,
    };
  }
  return mejor;
}

function submissionsUrl(cik: string): string {
  return `https://data.sec.gov/submissions/CIK${padCik(cik)}.json`;
}

export function getSubmissions(cik: string): Promise<RawSubmissions> {
  return secFetchJson<RawSubmissions>(submissionsUrl(cik), TTL.submissions);
}

export async function getCompanyProfile(
  cik: string,
  fallbackName?: string,
  fallbackTicker?: string,
): Promise<CompanyProfile> {
  try {
    const raw = await getSubmissions(cik);
    if (raw) return buildProfile(raw);
  } catch {
    // Si la entidad no tiene submissions directos en EDGAR (ej. ADRs OTC / no-filers)
  }

  return {
    cik: padCik(cik),
    name: fallbackName ?? "Empresa Cotizada",
    tickers: fallbackTicker ? [fallbackTicker] : [],
    exchanges: [],
    sic: "",
    sicDescription: "",
    sector: "No clasificado",
    fiscalYearEnd: null,
    website: null,
    address: null,
    stateOfIncorporation: null,
  };
}

export async function findLatestFiling(cik: string, forms: string[]): Promise<FilingRef | null> {
  try {
    const raw = await getSubmissions(cik);
    if (!raw) return null;
    return pickLatestFiling(raw, forms);
  } catch {
    return null;
  }
}
