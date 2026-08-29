import { getCacheStore, TTL } from "@/lib/cache/store";
import { fetchWithTimeout } from "@/lib/http";
import { secFetchText } from "@/lib/sec/client";

/** Descarga un informe anual HTML/XHTML tanto de SEC como de ESEF. */
export async function fetchAnnualReportHtml(url: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return null;

  if (parsed.hostname === "sec.gov" || parsed.hostname.endsWith(".sec.gov")) {
    return secFetchText(url, TTL.filingDocument);
  }

  const cache = getCacheStore();
  const key = `annual-report:html:${url}`;
  const cached = await cache.get<string>(key);
  if (cached !== null) return cached;

  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: "text/html, application/xhtml+xml, */*;q=0.2",
      "User-Agent": "Altius financial research",
    },
    cache: "no-store",
  }, 30_000);
  if (!response.ok) return null;
  const type = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (/pdf|zip|octet-stream/.test(type)) return null;
  const text = await response.text();
  if (!/<(?:html|xhtml|ix:header|body)\b/i.test(text)) return null;
  await cache.set(key, text, TTL.filingDocument);
  return text;
}
