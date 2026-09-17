export type MacroRegion = "eurozone" | "us";

export type MacroPoint = {
  date: string;
  value: number;
};

export type MacroEducation = {
  concept: string;
  dailyLife: string;
  investing: string;
};

export type MacroMetricConfig = {
  id: string;
  seriesId: string;
  label: string;
  shortLabel: string;
  region: MacroRegion;
  regionLabel: string;
  regionFlag: string;
  unit: string;
  chartUnit: string;
  description: string;
  color: string;
  source: string;
  sourceLabel: string;
  sourceUrl: string;
  yoy?: boolean;
  education: MacroEducation;
};

export const MACRO_METRICS: Record<string, MacroMetricConfig> = {
  // === EUROZONA ===
  CP0000EZ19M086NEST: {
    id: "CP0000EZ19M086NEST",
    seriesId: "CP0000EZ19M086NEST",
    label: "Inflación Eurozona (IPCA)",
    shortLabel: "Inflación Zona Euro",
    region: "eurozone",
    regionLabel: "Zona Euro",
    regionFlag: "🇪🇺",
    unit: "índice 2015 = 100",
    chartUnit: "%",
    description: "Índice de Precios de Consumo Armonizado (IPCA) para la zona euro. Se representa la variación interanual anualizada.",
    color: "#818cf8", // periwinkle
    source: "Eurostat / FRED",
    sourceLabel: "Eurostat / FRED (CP0000EZ19M086NEST)",
    sourceUrl: "https://fred.stlouisfed.org/series/CP0000EZ19M086NEST",
    yoy: true,
    education: {
      concept:
        "Mide la subida media de los precios de una cesta representativa de bienes y servicios (alimentación, energía, vivienda, transporte y ocio) en los países que usan el euro. El objetivo oficial del Banco Central Europeo es mantenerla en el 2 % anual.",
      dailyLife:
        "Si la inflación es del 3 %, lo que costaba 100 € ahora cuesta 103 €. Tu dinero ahorrado pierde poder adquisitivo si no genera una rentabilidad que supere esta tasa.",
      investing:
        "Una inflación moderada y estable permite a las empresas con fortaleza competitiva repercutir costes. Una inflación disparada fuerza al BCE a subir tipos, frenando la actividad económica y encareciendo el crédito.",
    },
  },
  ECBMRRFR: {
    id: "ECBMRRFR",
    seriesId: "ECBMRRFR",
    label: "Tipo de interés del BCE",
    shortLabel: "Tipos de interés BCE",
    region: "eurozone",
    regionLabel: "Zona Euro",
    regionFlag: "🇪🇺",
    unit: "%",
    chartUnit: "%",
    description: "Tipo de interés de las operaciones principales de financiación del Banco Central Europeo.",
    color: "#38bdf8", // sky
    source: "Banco Central Europeo / FRED",
    sourceLabel: "BCE / FRED (ECBMRRFR)",
    sourceUrl: "https://fred.stlouisfed.org/series/ECBMRRFR",
    education: {
      concept:
        "Es el precio oficial del dinero que fija el Consejo de Gobierno del BCE. Determina el coste al que los bancos comerciales europeos pueden obtener liquidez del banco central.",
      dailyLife:
        "Es la brújula que mueve el Euríbor. Cuando el BCE sube los tipos, las hipotecas variables y los préstamos se encarecen, pero los depósitos pagan algo más. Cuando los baja, financiarse es más accesible.",
      investing:
        "Tipos altos aumentan la rentabilidad de la deuda pública y bonos seguros, compitiendo con la bolsa. Tipos bajos reducen el coste de capital para las empresas y suelen alentar las cotizaciones bursátiles.",
    },
  },
  EZ_UNRATE: {
    id: "EZ_UNRATE",
    seriesId: "EZ_UNRATE",
    label: "Tasa de paro Eurozona",
    shortLabel: "Desempleo Zona Euro",
    region: "eurozone",
    regionLabel: "Zona Euro",
    regionFlag: "🇪🇺",
    unit: "%",
    chartUnit: "%",
    description: "Porcentaje de la población activa en desempleo desestacionalizado en la zona euro.",
    color: "#a78bfa", // violet
    source: "Eurostat",
    sourceLabel: "Eurostat (une_rt_m · EA21)",
    sourceUrl: "https://ec.europa.eu/eurostat/databrowser/view/une_rt_m/default/table",
    education: {
      concept:
        "Representa la proporción de personas en edad y disposición de trabajar que no tienen empleo y están buscándolo activamente en los países miembros de la zona euro.",
      dailyLife:
        "Un desempleo contenido ofrece mayor seguridad en el puesto de trabajo, mayores probabilidades de encontrar nuevo empleo y mejor poder de negociación para aumentos de sueldo.",
      investing:
        "Un mercado laboral con alto empleo impulsa el consumo doméstico y las ventas de las compañías cotizadas, consolidando los beneficios empresariales de forma sostenible.",
    },
  },

  // === ESTADOS UNIDOS ===
  CPIAUCSL: {
    id: "CPIAUCSL",
    seriesId: "CPIAUCSL",
    label: "Inflación EE.UU. (IPC)",
    shortLabel: "Inflación EE.UU.",
    region: "us",
    regionLabel: "Estados Unidos",
    regionFlag: "🇺🇸",
    unit: "índice 1982-84 = 100",
    chartUnit: "%",
    description: "Índice de precios al consumo para consumidores urbanos de EE.UU., desestacionalizado. Se muestra la variación interanual.",
    color: "#98a4f7", // periwinkle altius
    source: "Bureau of Labor Statistics / FRED",
    sourceLabel: "BLS / FRED (CPIAUCSL)",
    sourceUrl: "https://fred.stlouisfed.org/series/CPIAUCSL",
    yoy: true,
    education: {
      concept:
        "Indicador clave elaborado por la Oficina de Estadísticas Laborales de EE.UU. que mide el encarecimiento de la vida en la mayor economía del planeta.",
      dailyLife:
        "Determina el valor y poder de compra del dólar estadounidense. Las variaciones inflacionarias en EE.UU. suelen propagarse rápidamente a materias primas y energía a escala global.",
      investing:
        "Es el dato más analizado por los inversores globales. Cada publicación influye decisivamente en las expectativas de tipos de la Fed y en la cotización de los índices bursátiles internacionales.",
    },
  },
  FEDFUNDS: {
    id: "FEDFUNDS",
    seriesId: "FEDFUNDS",
    label: "Tipo de interés de la Fed",
    shortLabel: "Tipos de interés Fed",
    region: "us",
    regionLabel: "Estados Unidos",
    regionFlag: "🇺🇸",
    unit: "%",
    chartUnit: "%",
    description: "Tipo efectivo de los fondos federales de EE.UU., media mensual establecida por la Reserva Federal.",
    color: "#5b63d3", // altius accent
    source: "Federal Reserve / FRED",
    sourceLabel: "Fed / FRED (FEDFUNDS)",
    sourceUrl: "https://fred.stlouisfed.org/series/FEDFUNDS",
    education: {
      concept:
        "Tipo al que las entidades depositarias de EE.UU. se prestan saldos en la Reserva Federal de un día para otro. Es el tipo de referencia monetaria por excelencia del mundo.",
      dailyLife:
        "Afecta al tipo de cambio entre el euro y el dólar. Si el dólar se fortalece por tipos altos de la Fed, las importaciones como el petróleo o la tecnología cotizadas en dólares resultan más caras.",
      investing:
        "Es la referencia libre de riesgo que fija el listón de rentabilidad exigido a cualquier inversión en el mundo. Subidas rápidas de tipos enfrían los múltiplos de valoración de las acciones de crecimiento.",
    },
  },
  UNRATE: {
    id: "UNRATE",
    seriesId: "UNRATE",
    label: "Desempleo EE.UU.",
    shortLabel: "Desempleo EE.UU.",
    region: "us",
    regionLabel: "Estados Unidos",
    regionFlag: "🇺🇸",
    unit: "%",
    chartUnit: "%",
    description: "Tasa de paro civil en Estados Unidos, desestacionalizada, estimada mensualmente por el BLS.",
    color: "#c9d3ee", // frost
    source: "Bureau of Labor Statistics / FRED",
    sourceLabel: "BLS / FRED (UNRATE)",
    sourceUrl: "https://fred.stlouisfed.org/series/UNRATE",
    education: {
      concept:
        "Porcentaje de la fuerza laboral estadounidense que se encuentra sin trabajo pero buscando activamente empleo durante el periodo de referencia mensual.",
      dailyLife:
        "El estado del empleo estadounidense es el termómetro de la demanda de consumo del mayor importador del mundo, influyendo en la prosperidad del comercio internacional.",
      investing:
        "Un aumento repentino del desempleo suele ser el síntoma más claro de un cambio de ciclo o recesión, anticipando bajadas de tipos de interés para reactivar el mercado de trabajo.",
    },
  },
};

export const MACRO_SERIES_IDS = Object.keys(MACRO_METRICS);
