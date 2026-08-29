import { getCacheStore, TTL } from "@/lib/cache/store";
import { trimCik } from "@/lib/sec/client";
import { getSubmissions } from "@/lib/sec/submissions";
import type { CompanyNewsResult, NewsItem } from "./types";
import { fetchWithTimeout } from "@/lib/http";

export * from "./types";

/**
 * Decodifica entidades HTML básicas y limpia etiquetas HTML.
 */
function stripHtml(html: string): string {
  const decoded = html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, value: string) => String.fromCodePoint(Number(value)))
    .replace(/&#x([0-9a-f]+);/gi, (_, value: string) => String.fromCodePoint(Number.parseInt(value, 16)));
  return decoded
    .replace(/<[^>]*>/g, " ")
    .replace(/https?:\/\/\S+|www\.\S+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parsea un feed RSS XML estándar de noticias (Google News o Yahoo Finance).
 */
export function parseRssFeed(xml: string, defaultSource = "Mercado"): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemContent = match[1];

    const titleMatch = /<title>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/i.exec(itemContent);
    const linkMatch = /<link>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/link>/i.exec(itemContent);
    const pubDateMatch = /<pubDate>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/pubDate>/i.exec(itemContent);
    const descMatch = /<description>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/description>/i.exec(itemContent);
    const sourceMatch = /<source[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/source>/i.exec(itemContent);

    let rawTitle = titleMatch ? (titleMatch[1] ?? titleMatch[2] ?? "").trim() : "";
    const rawLink = linkMatch ? (linkMatch[1] ?? linkMatch[2] ?? "").trim() : "";
    const rawDate = pubDateMatch ? (pubDateMatch[1] ?? pubDateMatch[2] ?? "").trim() : "";
    const rawDesc = descMatch ? (descMatch[1] ?? descMatch[2] ?? "").trim() : "";
    let rawSource = sourceMatch ? (sourceMatch[1] ?? sourceMatch[2] ?? "").trim() : "";

    if (!rawTitle || !rawLink) continue;

    // En Google News, el nombre del medio suele venir al final del título: "Titular - Bloomberg"
    if (!rawSource && rawTitle.includes(" - ")) {
      const parts = rawTitle.split(" - ");
      if (parts.length > 1) {
        rawSource = parts.pop()!.trim();
        rawTitle = parts.join(" - ").trim();
      }
    }

    const source = stripHtml(rawSource) || defaultSource;
    let title = stripHtml(rawTitle);
    const visibleSuffix = ` - ${source}`;
    if (title.toLocaleLowerCase("en").endsWith(visibleSuffix.toLocaleLowerCase("en"))) {
      title = title.slice(0, -visibleSuffix.length).trim();
    }
    if (!/[\p{L}\p{N}]{3}/u.test(title)) title = "Nueva información relevante del mercado";
    const extractedSummary = stripHtml(rawDesc);
    const normalizedTitle = title.toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, "");
    const normalizedSummary = extractedSummary.toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, "");
    const summary = normalizedSummary === normalizedTitle
      || normalizedSummary === `${normalizedTitle}${source.toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, "")}`
      ? ""
      : extractedSummary;

    let isoDate: string;
    try {
      const parsedDate = new Date(rawDate);
      isoDate = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();
    } catch {
      isoDate = new Date().toISOString();
    }

    items.push({
      id: `${rawLink}-${isoDate}`,
      title,
      source,
      url: rawLink,
      publishedAt: isoDate,
      summary: summary.length > 0 ? summary.slice(0, 240) : undefined,
      isRegulatory: false,
      category: /earnings|results|dividend|revenue|profit/i.test(title) ? "earnings" : "market",
    });
  }

  return items;
}

/**
 * Extrae los hechos relevantes regulatorios oficiales (Formulario 8-K) de los registros de la SEC.
 */
export async function getSecRegulatoryNews(cik: string, companyName: string): Promise<NewsItem[]> {
  try {
    const raw = await getSubmissions(cik);
    const recent = raw.filings?.recent;
    if (!recent) return [];

    const items: NewsItem[] = [];
    const len = recent.form.length;

    for (let i = 0; i < len && items.length < 10; i++) {
      const form = recent.form[i]?.toUpperCase();
      if (form === "8-K" || form === "8-K/A") {
        const filingDate = recent.filingDate[i];
        const accessionNumber = recent.accessionNumber[i];
        const primaryDocument = recent.primaryDocument[i];

        const documentUrl =
          `https://www.sec.gov/Archives/edgar/data/${trimCik(raw.cik)}/` +
          `${accessionNumber.replace(/-/g, "")}/${primaryDocument}`;

        items.push({
          id: `sec-8k-${accessionNumber}`,
          title: `${companyName} comunica un nuevo hecho relevante mediante un ${form}`,
          source: "SEC EDGAR Form 8-K",
          url: documentUrl,
          publishedAt: `${filingDate}T00:00:00.000Z`,
          summary: `Informe de hechos de importancia inmediata presentado por ${companyName} ante la SEC el ${filingDate}.`,
          isRegulatory: true,
          category: "regulatory",
        });
      }
    }

    return items;
  } catch {
    return [];
  }
}

/**
 * Consulta noticias externas vía RSS de Google News / Yahoo Finance.
 */
export async function fetchRssNews(ticker: string, companyName: string): Promise<NewsItem[]> {
  const items: NewsItem[] = [];
  const cleanTicker = ticker.trim().toUpperCase();
  const cleanName = companyName.replace(/[,.]/g, "").replace(/\b(inc|corp|corporation|co|ltd|plc|class [a-z])\b/gi, "").trim();

  // 1. Google News RSS
  try {
    const query = `${cleanTicker} stock OR "${cleanName}"`;
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetchWithTimeout(url, {
      cache: "no-store",
      headers: { "User-Agent": "AltiusTerminal/1.0 (financial-research-terminal)" },
    });
    if (res.ok) {
      const xml = await res.text();
      const parsed = parseRssFeed(xml, "Google News");
      items.push(...parsed);
    }
  } catch {
    // Degradación limpia si la red externa RSS está bloqueada o limitada
  }

  // 2. Yahoo Finance RSS como refuerzo
  try {
    const yUrl = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(cleanTicker)}`;
    const yRes = await fetchWithTimeout(yUrl, {
      cache: "no-store",
      headers: { "User-Agent": "AltiusTerminal/1.0" },
    });
    if (yRes.ok) {
      const yXml = await yRes.text();
      const yParsed = parseRssFeed(yXml, "Yahoo Finance");
      items.push(...yParsed);
    }
  } catch {
    // Degradación limpia
  }

  return items;
}

/**
 * Agregador principal de noticias y hechos relevantes para un valor consultado.
 */
export async function getCompanyNews(
  ticker: string,
  companyName: string,
  cik?: string,
): Promise<CompanyNewsResult> {
  const cache = getCacheStore();
  const companyIdentity = cik ?? companyName.toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 80);
  const cacheKey = `news:v2:${ticker.toUpperCase()}:${companyIdentity}`;

  const cached = await cache.get<CompanyNewsResult>(cacheKey);
  if (cached) return cached;

  const promises: [Promise<NewsItem[]>, Promise<NewsItem[]>] = [
    cik ? getSecRegulatoryNews(cik, companyName) : Promise.resolve([]),
    fetchRssNews(ticker, companyName),
  ];

  const [secFilings, rssNews] = await Promise.all(promises);

  const combined = [...secFilings, ...rssNews];

  // Deduplicar por URL y por similitud de título
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const deduplicated: NewsItem[] = [];

  for (const item of combined) {
    const normTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 35);
    if (seenUrls.has(item.url) || seenTitles.has(normTitle)) continue;
    seenUrls.add(item.url);
    seenTitles.add(normTitle);
    deduplicated.push(item);
  }

  // Ordenar por fecha descendente
  deduplicated.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

  const sourcesSet = new Set(deduplicated.map((n) => n.source));
  const result: CompanyNewsResult = {
    ticker: ticker.toUpperCase(),
    companyName,
    news: deduplicated.slice(0, 20),
    sources: Array.from(sourcesSet),
  };

  await cache.set(cacheKey, result, TTL.news);
  return result;
}
