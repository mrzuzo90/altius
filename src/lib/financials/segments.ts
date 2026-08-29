import { htmlToText } from "@/lib/sec/mdna";

export type SegmentProfitEvidence = {
  name: string;
  profit: number;
  revenue: number | null;
  marginPct: number | null;
  currency: string | null;
  periodEnd: string | null;
  metricLabel: string;
  comparedSegments: number;
};

type Context = {
  id: string;
  segment: string;
  start: string | null;
  end: string | null;
};

type Fact = {
  contextRef: string;
  concept: string;
  value: number;
  unitRef: string | null;
};

function attribute(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  return match?.[1] ?? match?.[2] ?? null;
}

function stripTags(value: string): string {
  return value
    .replace(/<ix:exclude\b[^>]*>[\s\S]*?<\/ix:exclude>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&minus;|&#8722;/gi, "-")
    .replace(/&amp;/gi, "&")
    .trim();
}

function parseNumber(raw: string, tag: string): number | null {
  if (/\bnil\s*=\s*["']true["']/i.test(tag)) return null;
  const text = stripTags(raw).replace(/[\s,']/g, "");
  if (!text || text === "—" || text === "-") return null;
  const negative = /^\(.*\)$/.test(text) || attribute(tag, "sign") === "-";
  const numeric = Number(text.replace(/[()]/g, ""));
  if (!Number.isFinite(numeric)) return null;
  const scale = Number(attribute(tag, "scale") ?? "0");
  const scaled = numeric * (Number.isFinite(scale) ? 10 ** scale : 1);
  return negative ? -Math.abs(scaled) : scaled;
}

function prettyMember(value: string): string {
  const local = value.split(":").at(-1) ?? value;
  const readable = local
    .replace(/(?:Reportable)?SegmentMember$/i, "")
    .replace(/Member$/i, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/\bAws\b/g, "AWS")
    .replace(/\bUs\b/g, "US")
    .replace(/\s+/g, " ")
    .trim();
  const known: Record<string, string> = {
    "Amazon Web Services": "AWS",
    "Productivity And Business Processes": "Productividad y procesos empresariales",
    "Intelligent Cloud": "Nube inteligente",
    "More Personal Computing": "Informática personal",
    "Commercial And Investment Bank": "Banca comercial y de inversión",
    "Consumer And Community Banking": "Banca para particulares y pequeños negocios",
    "Asset And Wealth Management": "Gestión de activos y patrimonios",
    "North America": "Norteamérica",
    International: "Internacional",
  };
  return known[readable] ?? readable;
}

function parseContexts(html: string): Map<string, Context> {
  const contexts = new Map<string, Context>();
  const pattern = /<(?:xbrli:)?context\b([^>]*)>([\s\S]*?)<\/(?:xbrli:)?context>/gi;
  for (const match of html.matchAll(pattern)) {
    const id = attribute(match[1], "id");
    if (!id) continue;
    const members = [...match[2].matchAll(/<(?:xbrldi:)?explicitMember\b([^>]*)>([\s\S]*?)<\/(?:xbrldi:)?explicitMember>/gi)];
    const segmentMember = members.find((member) => {
      const dimension = attribute(member[1], "dimension") ?? "";
      return /(?:business|reportable|operating)?segments?axis/i.test(dimension);
    });
    if (!segmentMember) continue;
    const rawMember = stripTags(segmentMember[2]);
    if (/consolidated|elimination|corporate|allother|intersegment/i.test(rawMember)) continue;
    const start = match[2].match(/<(?:xbrli:)?startDate\b[^>]*>([^<]+)</i)?.[1]?.trim() ?? null;
    const end = match[2].match(/<(?:xbrli:)?endDate\b[^>]*>([^<]+)</i)?.[1]?.trim()
      ?? match[2].match(/<(?:xbrli:)?instant\b[^>]*>([^<]+)</i)?.[1]?.trim()
      ?? null;
    contexts.set(id, { id, segment: prettyMember(rawMember), start, end });
  }
  return contexts;
}

function parseUnits(html: string): Map<string, string> {
  const units = new Map<string, string>();
  const pattern = /<(?:xbrli:)?unit\b([^>]*)>([\s\S]*?)<\/(?:xbrli:)?unit>/gi;
  for (const match of html.matchAll(pattern)) {
    const id = attribute(match[1], "id");
    const measure = match[2].match(/<(?:xbrli:)?measure\b[^>]*>([^<]+)</i)?.[1]?.trim();
    if (id && measure) units.set(id, measure.replace(/^iso4217:/i, ""));
  }
  return units;
}

function parseFacts(html: string): Fact[] {
  const facts: Fact[] = [];
  const pattern = /<ix:nonfraction\b([^>]*)>([\s\S]*?)<\/ix:nonfraction>/gi;
  for (const match of html.matchAll(pattern)) {
    const concept = attribute(match[1], "name");
    const contextRef = attribute(match[1], "contextref");
    if (!concept || !contextRef) continue;
    const value = parseNumber(match[2], match[1]);
    if (value === null) continue;
    facts.push({ contextRef, concept, value, unitRef: attribute(match[1], "unitref") });
  }
  return facts;
}

function conceptPriority(concept: string, kind: "profit" | "revenue"): number {
  const local = concept.split(":").at(-1) ?? concept;
  if (kind === "profit") {
    if (/SegmentOperatingIncomeLoss|SegmentProfitLoss/i.test(local)) return 6;
    if (/^OperatingIncomeLoss$/i.test(local)) return 5;
    if (/ProfitLossFromOperatingActivities/i.test(local)) return 4;
    if (/OperatingProfit|OperatingIncome/i.test(local)) return 3;
    if (/SegmentNetIncome|NetIncomeLossAvailableToCommon/i.test(local)) return 3;
    if (/^NetIncomeLoss$|^ProfitLoss$/i.test(local)) return 2;
    return 0;
  }
  if (/RevenueFromContractWithCustomerExcludingAssessedTax/i.test(local)) return 6;
  if (/SalesRevenueNet|SegmentRevenue|Revenues$/i.test(local)) return 5;
  if (/Revenue|Sales/i.test(local)) return 2;
  return 0;
}

function profitMetricLabel(concept: string): string {
  const local = concept.split(":").at(-1) ?? concept;
  return /NetIncome|ProfitLoss$/i.test(local)
    ? "beneficio neto por segmento"
    : "beneficio operativo por segmento";
}

function isAnnual(context: Context): boolean {
  if (!context.start || !context.end) return true;
  const days = (Date.parse(context.end) - Date.parse(context.start)) / 86_400_000;
  return days >= 300 && days <= 430;
}

function isGeographicSegment(name: string): boolean {
  return /^(?:Americas?|Europe|Greater China|Japan|Rest Of Asia Pacific|Asia Pacific|EMEA|APAC|United States|Latin America)$/i.test(name);
}

/**
 * Lee los contextos dimensionales del Inline XBRL y compara beneficio
 * operativo por segmento. Nunca usa los ingresos como sustituto del beneficio.
 */
export function extractMostProfitableSegment(html: string): SegmentProfitEvidence | null {
  const contexts = parseContexts(html);
  if (contexts.size < 2) return extractNarrativeSegmentProfit(html);
  const units = parseUnits(html);
  const facts = parseFacts(html).filter((fact) => contexts.has(fact.contextRef));
  const profitFacts = facts.filter((fact) => conceptPriority(fact.concept, "profit") > 0);
  if (profitFacts.length < 2) return extractNarrativeSegmentProfit(html);

  const latestEnd = profitFacts
    .map((fact) => contexts.get(fact.contextRef)!)
    .filter(isAnnual)
    .map((context) => context.end)
    .filter((end): end is string => Boolean(end))
    .sort()
    .at(-1) ?? null;

  const bestBySegment = new Map<string, { fact: Fact; context: Context; priority: number }>();
  for (const fact of profitFacts) {
    const context = contexts.get(fact.contextRef)!;
    if (!isAnnual(context) || (latestEnd && context.end !== latestEnd)) continue;
    const priority = conceptPriority(fact.concept, "profit");
    const existing = bestBySegment.get(context.segment);
    if (!existing || priority > existing.priority) bestBySegment.set(context.segment, { fact, context, priority });
  }
  if (bestBySegment.size < 2) return extractNarrativeSegmentProfit(html);
  if ([...bestBySegment.keys()].every(isGeographicSegment)) return extractNarrativeSegmentProfit(html);

  const winner = [...bestBySegment.values()].sort((a, b) => b.fact.value - a.fact.value)[0];
  const revenue = facts
    .filter((fact) => fact.contextRef === winner.fact.contextRef && conceptPriority(fact.concept, "revenue") > 0)
    .sort((a, b) => conceptPriority(b.concept, "revenue") - conceptPriority(a.concept, "revenue"))[0]?.value ?? null;
  const marginPct = revenue !== null && revenue !== 0 ? (winner.fact.value / Math.abs(revenue)) * 100 : null;
  return {
    name: winner.context.segment,
    profit: winner.fact.value,
    revenue,
    marginPct,
    currency: winner.fact.unitRef ? units.get(winner.fact.unitRef) ?? null : null,
    periodEnd: winner.context.end,
    metricLabel: profitMetricLabel(winner.fact.concept),
    comparedSegments: bestBySegment.size,
  };
}

const NARRATIVE_SEGMENTS: Array<{ name: string; pattern: RegExp }> = [
  { name: "Vinos y bebidas espirituosas", pattern: /\bVins\s+et\s+Spiritueux\b/gi },
  { name: "Moda y marroquinería", pattern: /\bMode\s+et\s+Maroquinerie\b/gi },
  { name: "Perfumes y cosméticos", pattern: /\bParfums\s+et\s+Cosm[eé]tiques\b/gi },
  { name: "Relojes y joyería", pattern: /\bMontres\s+et\s+Joaillerie\b/gi },
  { name: "Distribución selectiva", pattern: /\bDistribution\s+s[eé]lective\b/gi },
];

function positions(text: string, pattern: RegExp): number[] {
  pattern.lastIndex = 0;
  return [...text.matchAll(pattern)].map((match) => match.index);
}

/**
 * Algunos ESEF etiquetan solo los estados primarios, pero el propio informe
 * imprime el resultado recurrente de cada división en tablas legibles. Este
 * fallback compara esas cifras sin usar ventas como aproximación.
 */
function extractNarrativeSegmentProfit(html: string): SegmentProfitEvidence | null {
  const text = htmlToText(html);
  const labels = NARRATIVE_SEGMENTS.flatMap((segment) => (
    positions(text, segment.pattern).map((index) => ({ index, name: segment.name }))
  )).sort((a, b) => a.index - b.index);
  if (labels.length < 2) return null;

  const metric = /R[eé]sultat\s+op[eé]rationnel\s+courant\s*(?:\([^)]*millions?\s+d['’]euros?[^)]*\))?/gi;
  const results = new Map<string, number>();
  for (const match of text.matchAll(metric)) {
    const nearest = [...labels].reverse().find((label) => label.index < match.index && match.index - label.index < 80_000);
    if (!nearest) continue;
    const following = text.slice(match.index + match[0].length, match.index + match[0].length + 350);
    const number = following.match(/-?\d{1,3}(?:[\s\u00a0\u202f]\d{3})+|-?\d{1,6}(?:[,.]\d+)?/)?.[0];
    if (!number) continue;
    const parsed = Number(number.replace(/[\s\u00a0\u202f]/g, "").replace(",", "."));
    if (Number.isFinite(parsed) && !results.has(nearest.name)) results.set(nearest.name, parsed * 1_000_000);
  }
  if (results.size < 2) return null;
  const [name, profit] = [...results.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    name,
    profit,
    revenue: null,
    marginPct: null,
    currency: "EUR",
    periodEnd: null,
    metricLabel: "resultado operativo recurrente por división",
    comparedSegments: results.size,
  };
}
