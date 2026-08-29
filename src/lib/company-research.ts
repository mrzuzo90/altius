import type { QualityCheckItem, QualityScorecardResult } from "@/lib/sec/quality";
import type { StatementBundle } from "@/lib/sec/statements";
import type { CompanyProfile } from "@/lib/sec/types";
import type { BusinessReportNarrative } from "@/lib/ai/business";
import type { SegmentProfitEvidence } from "@/lib/financials/segments";

export type BusinessSnapshot = {
  activity: string;
  revenueModel: string;
  profitEngine: {
    title: string;
    detail: string;
    status: "reported" | "not-disclosed";
  };
  regulatoryExcerpt: string | null;
  evidenceLabel: string;
  evidenceUrl: string | null;
  confidence: "regulatory" | "classified";
};

export type BusinessSnapshotAnalysis = {
  reportText?: string | null;
  /** Documento completo; solo se usa para localizar nombres concretos. */
  offeringText?: string | null;
  narrative?: BusinessReportNarrative | null;
  segmentProfit?: SegmentProfitEvidence | null;
};

export type CompanyAttentionItem = {
  id: string;
  eyebrow: string;
  title: string;
  value: string;
  detail: string;
  tone: "positive" | "watch" | "risk" | "neutral";
};

type BusinessKind =
  | "advertising-platform"
  | "ecommerce-cloud"
  | "software-cloud"
  | "payments"
  | "semiconductors"
  | "semiconductor-equipment"
  | "devices"
  | "banking"
  | "insurance"
  | "asset-management"
  | "healthcare-services"
  | "pharma"
  | "energy"
  | "mining"
  | "utilities"
  | "telecom"
  | "transport"
  | "automotive"
  | "retail"
  | "fashion-retail"
  | "consumer"
  | "luxury"
  | "restaurants"
  | "media"
  | "industrial"
  | "real-estate"
  | "diversified"
  | "services"
  | "general";

function classifyBusiness(profile: CompanyProfile, regulatoryExcerpt: string | null): BusinessKind {
  const text = `${profile.name} ${profile.sector} ${profile.sicDescription} ${regulatoryExcerpt ?? ""}`.toLocaleLowerCase("en");
  const classification = `${profile.name} ${profile.sector} ${profile.sicDescription}`.toLocaleLowerCase("en");
  if (/berkshire|conglomerate|diversified (?:holding|business)/.test(text)) return "diversified";
  if (/lvmh|luxury|lujo|marroquiner[ií]a|leather goods/.test(text)) return "luxury";
  if (/bank|banking|credit institution|commercial banks|depository institution|banco|banca comercial/.test(classification)) return "banking";
  if (/insurance|reinsurance|underwriting|asegur/.test(classification)) return "insurance";
  if (/asset management|investment management|blackrock|asset manager/.test(classification)) return "asset-management";
  if (/managed health|healthcare services|health care services|health insurance|hospital|medical services/.test(classification)) return "healthcare-services";
  if (/pharmaceutical|biotech|medicinal|drug manufacturer|biological products/.test(classification)) return "pharma";
  if (/asml|lithograph|semiconductor equipment/.test(classification)) return "semiconductor-equipment";
  if (/semiconductor|integrated circuit|microprocessor|memory chip/.test(classification)) return "semiconductors";
  if (/oil|natural gas|petroleum|refin|hydrocarbon/.test(classification)) return "energy";
  if (/mining|mineral|iron ore|copper|aluminium|gold ore/.test(classification)) return "mining";
  if (/electric services|utility|utilities|power generation/.test(classification)) return "utilities";
  if (/telecom|wireless|telephone communications/.test(classification)) return "telecom";
  if (/railroad|air transport|logistics|freight|transportation/.test(classification)) return "transport";
  if (/motor vehicle|automotive|automobile|electric vehicle/.test(classification)) return "automotive";
  if (/restaurant|coffee shop/.test(classification)) return "restaurants";
  if (/real estate|reit|property/.test(classification)) return "real-estate";
  if (/amazon|e-commerce|ecommerce|online marketplace/.test(text) && /cloud|web services|aws/.test(text)) return "ecommerce-cloud";
  if (/inditex|moda|textil|apparel retail|clothing store/.test(classification)) return "fashion-retail";
  if (/retail|minorista|stores|merchandise|warehouse club|catalog & mail-order|distribuci[oó]n.*(?:moda|textil)|distribuci[oó]n minorista/.test(classification)) return "retail";
  if (/prepackaged software|software publisher|microsoft|oracle|salesforce|sap\b|servicenow/.test(classification)) return "software-cloud";
  if (/apple inc|electronic computers|computer hardware/.test(classification)) return "devices";
  if (/alphabet|google|meta platforms|facebook/.test(classification) || /social media|search engine|youtube|online search/.test(text)) return "advertising-platform";
  if (/payment network|payment processing|credit card|payments technology|visa|mastercard|paypal/.test(text)) return "payments";
  if (/semiconductor|lithograph|integrated circuit|microprocessor|graphics processing|memory chip/.test(text)) return "semiconductors";
  if (/software|cloud computing|prepackaged software|saas|database/.test(text)) return "software-cloud";
  if (/smartphone|personal computer|electronic computer|consumer electronic|devices and services/.test(text)) return "devices";
  if (/insurance|reinsurance|underwriting|asegur/.test(text)) return "insurance";
  if (/bank|banking|credit institution|commercial banks|depository institution/.test(text)) return "banking";
  if (/asset management|investment management|blackrock|asset manager/.test(text)) return "asset-management";
  if (/managed health|healthcare services|health care services|health insurance|hospital|medical services/.test(text)) return "healthcare-services";
  if (/pharmaceutical|biotech|medicinal|drug manufacturer|biological products/.test(text)) return "pharma";
  if (/oil|natural gas|petroleum|refin|hydrocarbon/.test(text)) return "energy";
  if (/mining|mineral|iron ore|copper|aluminium|gold ore/.test(text)) return "mining";
  if (/electric services|utility|utilities|power generation|renewable energy/.test(text)) return "utilities";
  if (/telecom|wireless|communications services|telephone communications/.test(text)) return "telecom";
  if (/railroad|air transport|logistics|freight|transportation|delivery service/.test(text)) return "transport";
  if (/motor vehicle|automotive|automobile|electric vehicle/.test(text)) return "automotive";
  if (/restaurant|coffee shop|franchis/.test(text)) return "restaurants";
  if (/streaming|motion picture|entertainment|media service|booking|travel platform/.test(text)) return "media";
  if (/retail|minorista|stores|merchandise|warehouse club|catalog & mail-order|distribuci[oó]n.*(?:moda|textil)/.test(text)) return "retail";
  if (/beverage|food|tobacco|apparel|footwear|household product|personal care/.test(text)) return "consumer";
  if (/machinery|aerospace|defense|industrial|construction equipment|electrical equipment/.test(text)) return "industrial";
  if (/real estate|reit|property/.test(text)) return "real-estate";
  if (/business services|data processing|payroll|consulting|professional services/.test(text)) return "services";
  return "general";
}

const BUSINESS_COPY: Record<BusinessKind, { activity: string; revenueModel: string }> = {
  "advertising-platform": {
    activity: "Opera plataformas digitales que conectan usuarios, creadores y anunciantes, apoyadas por software, datos e infraestructura tecnológica.",
    revenueModel: "Cobra a los anunciantes por mostrar anuncios a públicos concretos. También puede cobrar suscripciones, servicios digitales o uso de infraestructura.",
  },
  "ecommerce-cloud": {
    activity: "Combina comercio electrónico, logística y una plataforma de infraestructura tecnológica en la nube.",
    revenueModel: "Ingresa por ventas directas, comisiones a vendedores, suscripciones, publicidad y consumo de servicios cloud.",
  },
  "software-cloud": {
    activity: "Desarrolla software y servicios tecnológicos que empresas y particulares usan en sus procesos, datos y operaciones digitales.",
    revenueModel: "Cobra por licencias de software, suscripciones mensuales o anuales, uso de la nube, soporte y servicios para empresas.",
  },
  payments: {
    activity: "Facilita pagos electrónicos entre consumidores, comercios, bancos y otras entidades mediante una red o plataforma tecnológica.",
    revenueModel: "Se queda con una pequeña comisión cada vez que procesa un pago y cobra por servicios adicionales a bancos y comercios; normalmente no presta el dinero de la compra.",
  },
  semiconductors: {
    activity: "Diseña, fabrica o comercializa semiconductores y tecnologías esenciales para computación, comunicaciones y centros de datos.",
    revenueModel: "Gana dinero vendiendo chips, sistemas y componentes; algunas compañías añaden licencias de propiedad intelectual y software.",
  },
  "semiconductor-equipment": {
    activity: "Fabrica máquinas y software que los fabricantes de chips necesitan para dibujar circuitos diminutos sobre las obleas de silicio.",
    revenueModel: "Cobra al vender cada máquina y sigue ingresando durante años por instalación, mantenimiento, repuestos, mejoras y software para los equipos ya instalados.",
  },
  devices: {
    activity: "Diseña y comercializa dispositivos tecnológicos, componentes, software y servicios conectados alrededor de su ecosistema.",
    revenueModel: "Cobra al vender los dispositivos y vuelve a ingresar dinero con aplicaciones, contenidos, almacenamiento, garantías y suscripciones.",
  },
  banking: {
    activity: "Intermedia ahorro y crédito y presta servicios bancarios a particulares, empresas e inversores.",
    revenueModel: "Gana con el margen entre intereses cobrados y pagados, además de comisiones por pagos, gestión, mercados y otros servicios financieros.",
  },
  insurance: {
    activity: "Asume y administra riesgos mediante seguros o reaseguros para particulares y empresas.",
    revenueModel: "Ingresa primas y obtiene rendimiento al invertir temporalmente el capital recibido antes de pagar siniestros y prestaciones.",
  },
  "asset-management": {
    activity: "Gestiona inversiones y soluciones de cartera para clientes institucionales y particulares.",
    revenueModel: "Cobra comisiones sobre los activos gestionados, productos de inversión, tecnología y, en ciertos casos, resultados obtenidos.",
  },
  "healthcare-services": {
    activity: "Presta, coordina o financia servicios sanitarios para pacientes, empresas y administraciones.",
    revenueModel: "Ingresa primas, cuotas o pagos por servicios médicos y gana según el equilibrio entre esos ingresos y el coste asistencial.",
  },
  pharma: {
    activity: "Investiga, desarrolla y comercializa medicamentos, terapias o productos sanitarios protegidos por regulación y propiedad intelectual.",
    revenueModel: "Gana con la venta de tratamientos y productos médicos; el precio, las patentes, el volumen y el éxito clínico determinan la economía del negocio.",
  },
  energy: {
    activity: "Participa en la producción, transformación, transporte o comercialización de petróleo, gas y otros productos energéticos.",
    revenueModel: "Sus ingresos dependen del volumen producido o refinado, los precios de la energía y los márgenes de transformación y comercialización.",
  },
  mining: {
    activity: "Extrae y procesa minerales y materias primas que abastecen a industrias globales.",
    revenueModel: "Gana vendiendo producción minera; los precios de las materias primas, el coste de extracción y la calidad de los activos marcan el margen.",
  },
  utilities: {
    activity: "Produce, transporta o distribuye electricidad, gas u otros servicios esenciales mediante infraestructuras de larga duración.",
    revenueModel: "Cobra por energía y capacidad suministrada, a menudo con tarifas reguladas o contratos de largo plazo.",
  },
  telecom: {
    activity: "Opera redes de comunicaciones que conectan personas, dispositivos y empresas.",
    revenueModel: "Cobra cuotas mensuales por conexión y datos, además de vender teléfonos, equipos y servicios a empresas.",
  },
  transport: {
    activity: "Mueve mercancías o pasajeros mediante una red logística y activos de transporte.",
    revenueModel: "Cobra por trayectos, envíos y servicios logísticos; volumen, precio por unidad, combustible y utilización de la red determinan el beneficio.",
  },
  automotive: {
    activity: "Diseña, fabrica y comercializa vehículos, componentes y servicios asociados a la movilidad.",
    revenueModel: "Gana con la venta o financiación de vehículos y con servicios, software, recambios o energía vinculados al parque instalado.",
  },
  retail: {
    activity: "Compra y distribuye productos de consumo a través de tiendas físicas, comercio electrónico o clubes de socios.",
    revenueModel: "Gana con el margen entre el precio de venta y el coste del producto; algunas cadenas añaden cuotas de membresía, publicidad o servicios.",
  },
  "fashion-retail": {
    activity: "Diseña y vende ropa, calzado, accesorios y artículos para el hogar a través de tiendas y comercio electrónico.",
    revenueModel: "Gana con la diferencia entre lo que cobra por cada prenda o artículo y lo que cuesta diseñarlo, fabricarlo, transportarlo y venderlo. La rotación rápida del inventario y las tiendas propias son claves.",
  },
  consumer: {
    activity: "Desarrolla y comercializa marcas y productos de consumo que se venden de forma recurrente a hogares y consumidores.",
    revenueModel: "Gana por volumen, precio y mezcla de productos, apoyándose en marca, distribución y repetición de compra.",
  },
  luxury: {
    activity: "Reúne marcas de lujo que venden moda, bolsos, perfumes, cosméticos, relojes, joyas, vinos y bebidas de alta gama.",
    revenueModel: "Gana al vender productos de lujo con márgenes altos, sobre todo a través de tiendas propias y distribución selectiva. Cada grupo de marcas aporta ventas y beneficio por separado.",
  },
  restaurants: {
    activity: "Opera o licencia establecimientos de restauración y una marca de consumo con presencia física y digital.",
    revenueModel: "Ingresa por ventas en locales propios y, cuando franquicia, por alquileres y royalties vinculados a las ventas de terceros.",
  },
  media: {
    activity: "Distribuye contenidos, entretenimiento o servicios digitales que conectan audiencias con una plataforma.",
    revenueModel: "Monetiza suscripciones, publicidad, comisiones o licencias; la escala de audiencia y el coste de contenido son determinantes.",
  },
  industrial: {
    activity: "Diseña y vende equipos, sistemas o componentes industriales para clientes empresariales y administraciones.",
    revenueModel: "Combina venta de equipos con recambios, mantenimiento, contratos de servicio y proyectos de larga duración.",
  },
  "real-estate": {
    activity: "Posee, desarrolla o gestiona inmuebles y activos reales destinados a alquiler o explotación.",
    revenueModel: "Gana con rentas, ocupación, revalorizaciones y, en ocasiones, desarrollo o venta de activos.",
  },
  diversified: {
    activity: "Agrupa negocios de distintas industrias bajo una misma matriz y asigna capital entre ellos.",
    revenueModel: "Gana con el beneficio de sus filiales, primas e inversiones, dividendos y plusvalías de las participaciones que controla.",
  },
  services: {
    activity: "Presta servicios especializados y soluciones operativas o tecnológicas a empresas y profesionales.",
    revenueModel: "Monetiza contratos, suscripciones, uso de plataforma y servicios recurrentes ligados al volumen de sus clientes.",
  },
  general: {
    activity: "Opera en la actividad que el regulador clasifica como {{industry}}, dentro del sector {{sector}}.",
    revenueModel: "Genera ingresos vendiendo los productos o servicios propios de esa actividad; el informe anual enlazado permite comprobar el detalle operativo.",
  },
};

const NAMED_OFFERINGS: Array<{ name: string; pattern: RegExp }> = [
  { name: "Azure", pattern: /\bAzure\b/i },
  { name: "Windows", pattern: /\bWindows\b/i },
  { name: "Microsoft 365", pattern: /\b(?:Microsoft|Office)\s*365\b/i },
  { name: "Teams", pattern: /\bMicrosoft\s+Teams\b|\bTeams\b/i },
  { name: "Dynamics 365", pattern: /\bDynamics\s*365\b/i },
  { name: "LinkedIn", pattern: /\bLinkedIn\b/i },
  { name: "Xbox", pattern: /\bXbox\b/i },
  { name: "GitHub", pattern: /\bGitHub\b/i },
  { name: "AWS", pattern: /\b(?:AWS|Amazon Web Services)\b/i },
  { name: "Amazon Prime", pattern: /\b(?:Amazon\s+)?Prime\b/i },
  { name: "Marketplace", pattern: /\bMarketplace\b/i },
  { name: "Whole Foods", pattern: /\bWhole Foods\b/i },
  { name: "Google Search", pattern: /\bGoogle Search\b/i },
  { name: "YouTube", pattern: /\bYouTube\b/i },
  { name: "Google Cloud", pattern: /\bGoogle Cloud\b/i },
  { name: "Android", pattern: /\bAndroid\b/i },
  { name: "Chrome", pattern: /\bChrome\b/i },
  { name: "Google Maps", pattern: /\bGoogle Maps\b|\bMaps\b/i },
  { name: "Facebook", pattern: /\bFacebook\b/i },
  { name: "Instagram", pattern: /\bInstagram\b/i },
  { name: "WhatsApp", pattern: /\bWhatsApp\b/i },
  { name: "Messenger", pattern: /\bMessenger\b/i },
  { name: "Quest", pattern: /\bMeta Quest\b|\bQuest\b/i },
  { name: "iPhone", pattern: /\biPhone\b/i },
  { name: "Mac", pattern: /\bMac\b/i },
  { name: "iPad", pattern: /\biPad\b/i },
  { name: "Apple Watch", pattern: /\bApple Watch\b/i },
  { name: "AirPods", pattern: /\bAirPods\b/i },
  { name: "App Store", pattern: /\bApp Store\b/i },
  { name: "iCloud", pattern: /\biCloud\b/i },
  { name: "GeForce", pattern: /\bGeForce\b/i },
  { name: "CUDA", pattern: /\bCUDA\b/i },
  { name: "DGX", pattern: /\bDGX\b/i },
  { name: "Oracle Cloud", pattern: /\bOracle Cloud\b/i },
  { name: "Java", pattern: /\bJava\b/i },
  { name: "MySQL", pattern: /\bMySQL\b/i },
  { name: "Salesforce", pattern: /\bSalesforce\b/i },
  { name: "Slack", pattern: /\bSlack\b/i },
  { name: "Tableau", pattern: /\bTableau\b/i },
  { name: "SAP S/4HANA", pattern: /\bS\/?4HANA\b/i },
  { name: "EUV", pattern: /\bEUV\b|extreme ultraviolet/i },
  { name: "DUV", pattern: /\bDUV\b|deep ultraviolet/i },
  { name: "Ozempic", pattern: /\bOzempic\b/i },
  { name: "Wegovy", pattern: /\bWegovy\b/i },
  { name: "Mounjaro", pattern: /\bMounjaro\b/i },
  { name: "Zepbound", pattern: /\bZepbound\b/i },
  { name: "Netflix", pattern: /\bNetflix\b/i },
  { name: "Disney+", pattern: /\bDisney\+\b/i },
  { name: "VisaNet", pattern: /\bVisaNet\b/i },
  { name: "Louis Vuitton", pattern: /\bLouis Vuitton\b/i },
  { name: "Christian Dior", pattern: /\bChristian Dior\b|\bDior\b/i },
  { name: "Moët & Chandon", pattern: /\bMo[eë]t\s*(?:&|and)\s*Chandon\b/i },
  { name: "Hennessy", pattern: /\bHennessy\b/i },
  { name: "Sephora", pattern: /\bSephora\b/i },
  { name: "Bulgari", pattern: /\bBulgari\b/i },
  { name: "Tiffany", pattern: /\bTiffany\b/i },
  { name: "Zara", pattern: /\bZara\b/i },
  { name: "Pull&Bear", pattern: /\bPull\s*(?:&|and)\s*Bear\b/i },
  { name: "Massimo Dutti", pattern: /\bMassimo Dutti\b/i },
  { name: "Bershka", pattern: /\bBershka\b/i },
  { name: "Stradivarius", pattern: /\bStradivarius\b/i },
  { name: "Oysho", pattern: /\bOysho\b/i },
];

const OFFERING_COMPANIES: Record<string, RegExp> = {
  Azure: /microsoft/i,
  Windows: /microsoft/i,
  "Microsoft 365": /microsoft/i,
  Teams: /microsoft/i,
  "Dynamics 365": /microsoft/i,
  LinkedIn: /microsoft/i,
  Xbox: /microsoft/i,
  GitHub: /microsoft/i,
  AWS: /amazon/i,
  "Amazon Prime": /amazon/i,
  Marketplace: /amazon/i,
  "Whole Foods": /amazon/i,
  "Google Search": /alphabet|google/i,
  YouTube: /alphabet|google/i,
  "Google Cloud": /alphabet|google/i,
  Android: /alphabet|google/i,
  Chrome: /alphabet|google/i,
  "Google Maps": /alphabet|google/i,
  Facebook: /meta platforms|facebook/i,
  Instagram: /meta platforms|facebook/i,
  WhatsApp: /meta platforms|facebook/i,
  Messenger: /meta platforms|facebook/i,
  Quest: /meta platforms|facebook/i,
  iPhone: /apple/i,
  Mac: /apple/i,
  iPad: /apple/i,
  "Apple Watch": /apple/i,
  AirPods: /apple/i,
  "App Store": /apple/i,
  iCloud: /apple/i,
  GeForce: /nvidia/i,
  CUDA: /nvidia/i,
  DGX: /nvidia/i,
  "Oracle Cloud": /oracle/i,
  Java: /oracle/i,
  MySQL: /oracle/i,
  Salesforce: /salesforce/i,
  Slack: /salesforce/i,
  Tableau: /salesforce/i,
  "SAP S/4HANA": /sap\b/i,
  EUV: /asml/i,
  DUV: /asml/i,
  Ozempic: /novo nordisk/i,
  Wegovy: /novo nordisk/i,
  Mounjaro: /eli lilly/i,
  Zepbound: /eli lilly/i,
  Netflix: /netflix/i,
  "Disney+": /walt disney/i,
  VisaNet: /visa/i,
  "Louis Vuitton": /lvmh|mo[eë]t hennessy louis vuitton/i,
  "Christian Dior": /lvmh|mo[eë]t hennessy louis vuitton/i,
  "Moët & Chandon": /lvmh|mo[eë]t hennessy louis vuitton/i,
  Hennessy: /lvmh|mo[eë]t hennessy louis vuitton/i,
  Sephora: /lvmh|mo[eë]t hennessy louis vuitton/i,
  Bulgari: /lvmh|mo[eë]t hennessy louis vuitton/i,
  Tiffany: /lvmh|mo[eë]t hennessy louis vuitton/i,
  Zara: /industria de dise[nñ]o textil|inditex/i,
  "Pull&Bear": /industria de dise[nñ]o textil|inditex/i,
  "Massimo Dutti": /industria de dise[nñ]o textil|inditex/i,
  Bershka: /industria de dise[nñ]o textil|inditex/i,
  Stradivarius: /industria de dise[nñ]o textil|inditex/i,
  Oysho: /industria de dise[nñ]o textil|inditex/i,
};

function joinSpanish(values: readonly string[]): string {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} y ${values[1]}`;
  return `${values.slice(0, -1).join(", ")} y ${values.at(-1)}`;
}

/** Nombres concretos que aparecen de verdad en el informe suministrado. */
export function extractNamedOfferings(reportText: string, company = ""): string[] {
  return NAMED_OFFERINGS
    .filter((offering) => (
      (!company || !OFFERING_COMPANIES[offering.name] || OFFERING_COMPANIES[offering.name].test(company))
      && offering.pattern.test(reportText)
    ))
    .slice(0, 7)
    .map((offering) => offering.name);
}

function concreteActivity(kind: BusinessKind, fallback: string, offerings: readonly string[]): string {
  if (offerings.length === 0) return fallback;
  const names = joinSpanish(offerings.slice(0, 6));
  if (kind === "software-cloud") return `Vende y mantiene productos concretos como ${names}. Cobra tanto por licencias y suscripciones como por el uso de sus servicios en la nube.`;
  if (kind === "ecommerce-cloud") return `Reúne comercio electrónico y tecnología: opera servicios como ${names}, además de su red de tiendas, vendedores y logística.`;
  if (kind === "devices") return `Diseña y vende ${names}, y completa esos productos con aplicaciones, contenidos, almacenamiento y soporte.`;
  if (kind === "semiconductors") return `Su negocio gira alrededor de ${names}: tecnología y equipos que otras empresas usan para fabricar o hacer funcionar sistemas informáticos.`;
  if (kind === "semiconductor-equipment") return `Fabrica máquinas ${names} y el software necesario para que los productores de chips dibujen circuitos diminutos sobre obleas de silicio.`;
  if (kind === "advertising-platform") return `Opera productos de uso masivo como ${names}. Los usuarios suelen acceder gratis y la empresa monetiza la audiencia y los servicios de pago.`;
  if (kind === "pharma") return `Desarrolla y vende tratamientos concretos como ${names}, desde la investigación clínica hasta su comercialización.`;
  if (kind === "luxury") return `Reúne marcas de lujo como ${names}. Vende moda, bolsos, perfumes, cosméticos, relojes, joyas, vinos y bebidas de alta gama.`;
  if (kind === "fashion-retail") return `Diseña y vende ropa, calzado, accesorios y artículos para el hogar con marcas como ${names}, tanto en tiendas como por internet.`;
  return `${fallback} Entre los productos y servicios que el propio informe destaca están ${names}.`;
}

function formatMoney(value: number, currency: string): string {
  const absolute = Math.abs(value);
  const scaled = absolute >= 1e9 ? absolute / 1e9 : absolute >= 1e6 ? absolute / 1e6 : absolute / 1e3;
  const unit = absolute >= 1e9 ? "mil millones" : absolute >= 1e6 ? "millones" : "miles";
  const formatted = new Intl.NumberFormat("es-ES", { maximumFractionDigits: scaled < 100 ? 1 : 0 }).format(scaled);
  return `${value < 0 ? "−" : ""}${formatted} ${unit}${currency ? ` ${currency}` : ""}`;
}

export function buildBusinessSnapshot(
  profile: CompanyProfile,
  bundle: StatementBundle,
  regulatoryExcerpt: string | null,
  evidence?: { label: string; url: string | null },
  analysis: BusinessSnapshotAnalysis = {},
): BusinessSnapshot {
  const kind = classifyBusiness(profile, analysis.reportText ?? regulatoryExcerpt);
  const copy = BUSINESS_COPY[kind];
  const fallbackActivity = copy.activity
    .replace("{{industry}}", profile.sicDescription || "su industria declarada")
    .replace("{{sector}}", profile.sector || "no clasificado");
  const offerings = extractNamedOfferings(analysis.offeringText ?? analysis.reportText ?? regulatoryExcerpt ?? "", profile.name);
  const activity = analysis.narrative?.activity
    ?? concreteActivity(kind, fallbackActivity, offerings);
  const revenueModel = analysis.narrative?.revenueModel ?? copy.revenueModel;
  const segment = analysis.segmentProfit;
  const profitEngine = segment ? {
    title: segment.name,
    detail: segment.profit >= 0
      ? `Es la división con más ${segment.metricLabel} entre las ${segment.comparedSegments} comparables del último informe: ${formatMoney(segment.profit, segment.currency ?? bundle.currency ?? "")}${segment.marginPct !== null ? `, con un margen aproximado del ${new Intl.NumberFormat("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(segment.marginPct)} %` : ""}${segment.periodEnd ? ` en el ejercicio cerrado el ${segment.periodEnd}` : ""}.`
      : `Todas las divisiones comparables presentan pérdidas; ${segment.name} es la que menos pierde, con ${formatMoney(segment.profit, segment.currency ?? bundle.currency ?? "")}${segment.periodEnd ? ` en el ejercicio cerrado el ${segment.periodEnd}` : ""}.`,
    status: "reported" as const,
  } : {
    title: "No publicado de forma comparable",
    detail: "El informe no desglosa un beneficio operativo comparable para al menos dos divisiones. Por eso no se señala una como la más rentable basándose solo en ventas.",
    status: "not-disclosed" as const,
  };

  return {
    activity,
    revenueModel,
    profitEngine,
    regulatoryExcerpt,
    evidenceLabel: evidence?.label ?? bundle.source?.label ?? "fuente regulatoria",
    evidenceUrl: evidence?.url ?? bundle.source?.href ?? null,
    confidence: regulatoryExcerpt || offerings.length > 0 || analysis.narrative || analysis.segmentProfit ? "regulatory" : "classified",
  };
}

const ATTENTION_TITLES: Record<string, Record<"pass" | "warn" | "fail" | "unknown", string>> = {
  growth: {
    pass: "El crecimiento llega al beneficio por acción",
    warn: "El crecimiento todavía no es redondo",
    fail: "Ventas y beneficio no avanzan juntos",
    unknown: "Falta histórico para juzgar el crecimiento",
  },
  returns: {
    pass: "El capital trabaja con fuerza",
    warn: "La rentabilidad del capital es intermedia",
    fail: "El capital produce poco retorno",
    unknown: "No se puede medir bien el retorno",
  },
  cashQuality: {
    pass: "El beneficio sí termina en caja",
    warn: "La conversión en caja merece seguimiento",
    fail: "La caja no acompaña al beneficio",
    unknown: "La calidad del beneficio no está cubierta",
  },
  balance: {
    pass: "El balance da margen de maniobra",
    warn: "La deuda exige vigilancia",
    fail: "El balance es un punto de riesgo",
    unknown: "No hay cobertura suficiente del balance",
  },
  perShare: {
    pass: "El accionista no se diluye",
    warn: "Hay una ligera dilución por acción",
    fail: "La emisión de acciones resta crecimiento",
    unknown: "Falta la serie de acciones diluidas",
  },
  valuation: {
    pass: "La valoración no supera su historia",
    warn: "El precio incorpora una prima moderada",
    fail: "El precio exige más que su valoración habitual",
    unknown: "El precio no puede compararse con su historia",
  },
};

const ITEM_PRIORITY = ["growth", "returns", "cashQuality", "balance", "perShare", "valuation"];

function byPriority(a: QualityCheckItem, b: QualityCheckItem): number {
  return ITEM_PRIORITY.indexOf(a.id) - ITEM_PRIORITY.indexOf(b.id);
}

function attentionFrom(item: QualityCheckItem): CompanyAttentionItem {
  const tone = item.status === "pass" ? "positive" : item.status === "warn" ? "watch" : item.status === "fail" ? "risk" : "neutral";
  return {
    id: item.id,
    eyebrow: item.category,
    title: ATTENTION_TITLES[item.id]?.[item.status] ?? item.name,
    value: item.valueFormatted,
    detail: item.description,
    tone,
  };
}

export function buildCompanyAttention(scorecard: QualityScorecardResult): CompanyAttentionItem[] {
  const failures = scorecard.items.filter((item) => item.status === "fail").sort(byPriority);
  const warnings = scorecard.items.filter((item) => item.status === "warn").sort(byPriority);
  const passes = scorecard.items.filter((item) => item.status === "pass").sort(byPriority);
  const unknown = scorecard.items.filter((item) => item.status === "unknown").sort(byPriority);
  const selected: QualityCheckItem[] = [];

  if (failures.length >= 2) {
    selected.push(...failures.slice(0, 2));
    if (passes[0]) selected.push(passes[0]);
  } else {
    if (failures[0]) selected.push(failures[0]);
    if (warnings[0] && selected.length < 3) selected.push(warnings[0]);
    if (passes[0] && selected.length < 3) selected.push(passes[0]);
  }

  for (const item of [...failures, ...warnings, ...passes, ...unknown]) {
    if (selected.length >= 3) break;
    if (!selected.some((candidate) => candidate.id === item.id)) selected.push(item);
  }

  return selected.slice(0, 3).map(attentionFrom);
}
