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
    ticker: "IBE.MC",
    name: "Iberdrola, S.A.",
    lei: "5QK37QC7NWOJ8D7WVQ45",
    exchange: "BME",
    country: "España",
    sector: "Utilities",
    industry: "Generación y distribución de energía eléctrica y renovables",
    aliases: [
      "IBE.MC",
      "IBE",
      "BME:IBE",
      "BME: IBE",
      "MC:IBE",
      "IBERDROLA",
      "IBERDROLA SA",
      "IBDRY",
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
    aliases: [
      "ITX.MC",
      "ITX",
      "BME:ITX",
      "BME: ITX",
      "MC:ITX",
      "INDITEX",
      "INDUSTRIA DE DISENO TEXTIL",
      "IDEXY",
    ],
  },
  {
    ticker: "TEF.MC",
    name: "Telefónica, S.A.",
    lei: "549300EEJH4FEPDBBR25",
    exchange: "BME",
    country: "España",
    sector: "Telecomunicaciones",
    industry: "Operador integrado de telecomunicaciones fijas, móviles y fibra",
    aliases: [
      "TEF.MC",
      "TEF",
      "BME:TEF",
      "BME: TEF",
      "MC:TEF",
      "TELEFONICA",
      "TELEFONICA SA",
    ],
  },
  {
    ticker: "IDR.MC",
    name: "Indra Sistemas, S.A.",
    lei: "95980020140005308793",
    exchange: "BME",
    country: "España",
    sector: "Tecnología",
    industry: "Tecnologías de la información, defensa, tráfico aéreo y movilidad",
    aliases: [
      "IDR.MC",
      "IDR",
      "BME:IDR",
      "BME: IDR",
      "MC:IDR",
      "INDRA",
      "INDRA SISTEMAS",
      "ISMAY",
    ],
  },
  {
    ticker: "AENA.MC",
    name: "Aena S.M.E., S.A.",
    lei: "959800R7QMXKF0NFMT29",
    exchange: "BME",
    country: "España",
    sector: "Industriales",
    industry: "Gestión y operación de infraestructuras aeroportuarias",
    aliases: [
      "AENA.MC",
      "AENA",
      "BME:AENA",
      "BME: AENA",
      "MC:AENA",
      "AENA SME",
      "AENA AEROPUERTOS",
      "ANYYY",
    ],
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
  {
    ticker: "NOKIA.HE",
    name: "Nokia Oyj",
    lei: "549300A0JPRWG1KI7U06",
    exchange: "Nasdaq Helsinki",
    country: "Finlandia",
    sector: "Tecnología",
    industry: "Equipos de telecomunicaciones y redes",
    aliases: [
      "NOKIA.HE",
      "NOKIA",
      "HEL:NOKIA",
      "HEL: NOKIA",
      "NOK",
      "NOKIA OYJ",
    ],
  },
  {
    ticker: "2498.TW",
    name: "HTC Corporation",
    lei: "",
    exchange: "TWSE",
    country: "Taiwán",
    sector: "Tecnología",
    industry: "Electrónica de consumo",
    aliases: [
      "2498.TW",
      "2498",
      "TPE: 2498",
      "TPE:2498",
      "TWSE: 2498",
      "TWSE:2498",
      "HTC",
      "HTC CORP",
      "HTC CORPORATION",
    ],
  },
];

function stripDiacritics(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

export function resolveEsefCompany(query: string): EsefCompany | null {
  const normalized = stripDiacritics(query.trim()).toUpperCase();
  const normalizedClean = normalized.replace(/\s*:\s*/g, ":");
  return (
    ESEF_COMPANIES.find((company) =>
      company.aliases.some((alias) => {
        const a = stripDiacritics(alias).toUpperCase();
        return a === normalized || a === normalizedClean;
      }),
    ) ?? null
  );
}
