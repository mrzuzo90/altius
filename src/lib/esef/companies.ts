export type EsefCompany = {
  ticker: string;
  name: string;
  lei: string;
  exchange: string;
  country: string;
  sector: string;
  industry?: string;
  aliases: string[];
};

/** Primer catálogo verificable. El universo completo se obtendrá del índice ESEF + GLEIF. */
export const ESEF_COMPANIES: EsefCompany[] = [
  {
    ticker: "MC.PA",
    name: "LVMH Moët Hennessy Louis Vuitton SE",
    lei: "IOG4E947OATN0KJYSD45",
    exchange: "Euronext Paris",
    country: "Francia",
    sector: "Consumo discrecional",
    industry: "Productos de lujo, moda, marroquinería, vinos y distribución selectiva",
    aliases: [
      "MC.PA",
      "LVMH",
      "LOUIS VUITTON",
      "MOET HENNESSY",
      "LVMH MOET HENNESSY LOUIS VUITTON",
    ],
  },
  {
    ticker: "ITX.MC",
    name: "Industria de Diseño Textil, S.A.",
    lei: "549300TTCXZOGZM2EY83",
    exchange: "BME",
    country: "España",
    sector: "Consumo discrecional",
    industry: "Distribución minorista de moda y productos textiles",
    aliases: ["ITX.MC", "ITX", "INDITEX", "IDEXY"],
  },
  {
    ticker: "SAN.MC",
    name: "Banco Santander, S.A.",
    lei: "5493006QMFDDMYWIAM13",
    exchange: "BME",
    country: "España",
    sector: "Financiero",
    industry: "Banca comercial y servicios financieros",
    aliases: ["SAN.MC", "BANCO SANTANDER", "SANTANDER ESPAÑA"],
  },
  {
    ticker: "ASML.AS",
    name: "ASML Holding N.V.",
    lei: "724500Y6DUVHQD6OXN27",
    exchange: "Euronext Amsterdam",
    country: "Países Bajos",
    sector: "Tecnología",
    industry: "Equipos de litografía para fabricar semiconductores",
    aliases: ["ASML.AS", "ASML", "ASML HOLDING"],
  },
];

export function resolveEsefCompany(query: string): EsefCompany | null {
  const normalized = query.trim().toUpperCase();
  return ESEF_COMPANIES.find((company) => company.aliases.some((alias) => alias.toUpperCase() === normalized)) ?? null;
}
