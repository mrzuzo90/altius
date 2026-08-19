/** Un hecho XBRL tal y como lo publica la SEC en `companyfacts`. */
export type XbrlFact = {
  /** Presente solo en hechos de duración (P&G, flujo de caja). */
  start?: string;
  /** Fecha de cierre del periodo, o instante en el caso del balance. */
  end: string;
  val: number;
  /** Número de acceso de la presentación de la que procede el hecho. */
  accn: string;
  fy?: number;
  fp?: string;
  form?: string;
  /** Fecha de presentación. Desempata reexpresiones: gana la más reciente. */
  filed: string;
  frame?: string;
};

export type XbrlConcept = {
  label?: string;
  description?: string;
  units: Record<string, XbrlFact[]>;
};

export type CompanyFacts = {
  cik: number;
  entityName: string;
  facts: Record<string, Record<string, XbrlConcept>>;
};

export type CompanyProfile = {
  cik: string;
  name: string;
  tickers: string[];
  exchanges: string[];
  sic: string;
  sicDescription: string;
  sector: string;
  fiscalYearEnd: string | null;
  website: string | null;
  address: string | null;
  stateOfIncorporation: string | null;
};

export type FilingRef = {
  form: string;
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  primaryDocument: string;
  documentUrl: string;
};
