export type BudgetCategoryId =
  | "vivienda"
  | "ahorro"
  | "comida"
  | "ocio"
  | "suministros"
  | "otros";

export type BudgetCategoryConfig = {
  id: BudgetCategoryId;
  label: string;
  shortLabel: string;
  defaultPct: number;
  description: string;
  examples: string;
  color: string;
  accentClass: string;
};

export const BUDGET_CATEGORIES: Record<BudgetCategoryId, BudgetCategoryConfig> = {
  vivienda: {
    id: "vivienda",
    label: "Gastos de Vivienda",
    shortLabel: "Vivienda",
    defaultPct: 30,
    description: "Hipoteca, alquiler, comunidad, IBI y seguro de hogar.",
    examples: "Hipoteca/alquiler, IBI, comunidad",
    color: "#60a5fa", // sky blue
    accentClass: "text-sky-400 border-sky-500/30 bg-sky-500/10",
  },
  ahorro: {
    id: "ahorro",
    label: "Ahorro e Inversión",
    shortLabel: "Ahorro",
    defaultPct: 20,
    description: "Fondo de emergencia, fondos indexados, acciones y jubilación.",
    examples: "Inversión, colchón de emergencia, aportaciones",
    color: "#34d399", // emerald
    accentClass: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
  comida: {
    id: "comida",
    label: "Comida",
    shortLabel: "Comida",
    defaultPct: 15,
    description: "Compra de supermercado y alimentación básica familiar.",
    examples: "Supermercado, carnicería, frutería",
    color: "#f59e0b", // amber
    accentClass: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
  ocio: {
    id: "ocio",
    label: "Ocio / Estilo de Vida",
    shortLabel: "Ocio",
    defaultPct: 15,
    description: "Restaurantes, viajes, salidas, aficiones, compras y suscripciones.",
    examples: "Cenas, viajes, cine, suscripciones",
    color: "#a78bfa", // violet
    accentClass: "text-violet-400 border-violet-500/30 bg-violet-500/10",
  },
  suministros: {
    id: "suministros",
    label: "Suministros y Servicios",
    shortLabel: "Suministros",
    defaultPct: 10,
    description: "Electricidad, gas, agua, telefonía móvil e internet.",
    examples: "Luz, gas, agua, internet, móvil",
    color: "#38bdf8", // cyan
    accentClass: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  },
  otros: {
    id: "otros",
    label: "Otros / Imprevistos",
    shortLabel: "Otros",
    defaultPct: 10,
    description: "Transporte, combustible, salud, farmacia y gastos inesperados.",
    examples: "Gasolina, transporte, averías, farmacia",
    color: "#fb7185", // rose
    accentClass: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  },
};

export const BUDGET_CATEGORY_ORDER: BudgetCategoryId[] = [
  "vivienda",
  "ahorro",
  "comida",
  "ocio",
  "suministros",
  "otros",
];

export type CompoundInterestPresetId =
  | "sp500"
  | "nasdaq"
  | "msci_world"
  | "eurostoxx"
  | "ibex35"
  | "bono_renta_fija"
  | "company"
  | "custom";

export type HistoricalPricePoint = {
  date: string;
  close: number;
};

export type HistoricalCagrResult = {
  ticker: string;
  companyName: string;
  startDate: string;
  endDate: string;
  startPrice: number;
  endPrice: number;
  actualYears: number;
  requestedYears: number;
  hasEnoughHistory: boolean;
  totalReturnPct: number;
  cagrPct: number;
};

export type CompoundInterestPreset = {
  id: CompoundInterestPresetId;
  name: string;
  shortName: string;
  ratePct: number;
  description: string;
  historicalContext: string;
};

export const COMPOUND_INTEREST_PRESETS: CompoundInterestPreset[] = [
  {
    id: "sp500",
    name: "S&P 500",
    shortName: "S&P 500",
    ratePct: 10.0,
    description: "Media histórica anualizada de los últimos 10 años.",
    historicalContext: "Las 500 mayores empresas cotizadas de Estados Unidos.",
  },
  {
    id: "nasdaq",
    name: "NASDAQ",
    shortName: "NASDAQ",
    ratePct: 12.5,
    description: "Media histórica de rendimiento tecnológico.",
    historicalContext: "Índice de referencia de las empresas líderes en tecnología e innovación.",
  },
  {
    id: "msci_world",
    name: "MSCI World",
    shortName: "MSCI World",
    ratePct: 8.0,
    description: "Promedio global diversificado.",
    historicalContext: "Renta variable global de más de 23 países desarrollados.",
  },
  {
    id: "eurostoxx",
    name: "Eurostoxx 50",
    shortName: "Eurostoxx 50",
    ratePct: 6.0,
    description: "Promedio europeo.",
    historicalContext: "Las 50 mayores empresas cotizadas de la Eurozona.",
  },
  {
    id: "ibex35",
    name: "IBEX 35",
    shortName: "IBEX 35",
    ratePct: 4.5,
    description: "Promedio histórico con dividendos.",
    historicalContext: "Principal selectivo bursátil del mercado español.",
  },
  {
    id: "bono_renta_fija",
    name: "Bono Institucional / Renta Fija",
    shortName: "Renta Fija",
    ratePct: 3.5,
    description: "Promedio de deuda pública a largo plazo.",
    historicalContext: "Bonos soberanos e instrumentos de deuda gubernamental de alta calidad.",
  },
];
