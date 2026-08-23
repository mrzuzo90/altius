export type MarketLeader = {
  ticker: string;
  name: string;
  sector: string;
  region?: "us" | "europe";
  country?: string;
  price: number;
  changePct: number;
  marketCap: number; // in Millions USD
  pe: number | null;
  evEbitda: number | null;
  fcfMargin: number | null;
  roic: number | null;
  revenueGrowth: number | null;
  trend: number[];
};

export type MarketLeaderMeta = {
  ticker: string;
  name: string;
  sector: string;
  region: "us" | "europe";
  country: string;
  cik?: string;
  pe?: number | null;
  evEbitda?: number | null;
  fcfMargin?: number | null;
  roic?: number | null;
  revenueGrowth?: number | null;
  marketCapBase?: number;
};

export const MARKET_LEADER_CONFIGS: MarketLeaderMeta[] = [
  // EE. UU.
  {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    sector: "Semiconductors",
    region: "us",
    country: "Estados Unidos",
    cik: "0001045810",
  },
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    sector: "Technology",
    region: "us",
    country: "Estados Unidos",
    cik: "0000320193",
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    sector: "Software & Cloud",
    region: "us",
    country: "Estados Unidos",
    cik: "0000789019",
  },
  {
    ticker: "AMZN",
    name: "Amazon.com Inc.",
    sector: "E-Commerce & AWS",
    region: "us",
    country: "Estados Unidos",
    cik: "0001018724",
  },
  {
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    sector: "Internet & Ads",
    region: "us",
    country: "Estados Unidos",
    cik: "0001652044",
  },
  {
    ticker: "META",
    name: "Meta Platforms Inc.",
    sector: "Social Media & AI",
    region: "us",
    country: "Estados Unidos",
    cik: "0001326801",
  },
  {
    ticker: "TSLA",
    name: "Tesla Inc.",
    sector: "Automotive & Energy",
    region: "us",
    country: "Estados Unidos",
    cik: "0001318605",
  },

  // Europa
  {
    ticker: "ASML",
    name: "ASML Holding N.V.",
    sector: "Semiconductors",
    region: "europe",
    country: "Países Bajos",
    cik: "0000937966",
  },
  {
    ticker: "NVO",
    name: "Novo Nordisk A/S",
    sector: "Pharmaceuticals",
    region: "europe",
    country: "Dinamarca",
    cik: "0000353278",
  },
  {
    ticker: "SAP",
    name: "SAP SE",
    sector: "Software & Cloud",
    region: "europe",
    country: "Alemania",
    cik: "0001000184",
  },
  {
    ticker: "SAN",
    name: "Banco Santander, S.A.",
    sector: "Banking & Finance",
    region: "europe",
    country: "España",
    cik: "0000891478",
  },
  {
    ticker: "TTE",
    name: "TotalEnergies SE",
    sector: "Energy & Renewables",
    region: "europe",
    country: "Francia",
    cik: "0000879764",
  },
  {
    ticker: "IBDRY",
    name: "Iberdrola, S.A.",
    sector: "Utilities & Clean Energy",
    region: "europe",
    country: "España",
  },
  {
    ticker: "AZN",
    name: "AstraZeneca PLC",
    sector: "Pharmaceuticals",
    region: "europe",
    country: "Reino Unido",
    cik: "0000901832",
  },
];

/** Fallback tipado para render en cliente */
export const MARKET_LEADERS: MarketLeader[] = MARKET_LEADER_CONFIGS.map((meta) => ({
  ticker: meta.ticker,
  name: meta.name,
  sector: meta.sector,
  region: meta.region,
  country: meta.country,
  price: 0,
  changePct: 0,
  marketCap: 0,
  pe: null,
  evEbitda: null,
  fcfMargin: null,
  roic: null,
  revenueGrowth: null,
  trend: [],
}));
