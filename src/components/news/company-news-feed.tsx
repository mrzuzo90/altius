"use client";

import { useMemo, useState } from "react";
import {
  ExternalLink,
  Globe,
  Newspaper,
  ShieldCheck,
} from "lucide-react";
import type { NewsItem } from "@/lib/news/types";
import { cn } from "@/lib/utils";

function formatNewsDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.slice(0, 10);
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr.slice(0, 10);
  }
}

function displayHeadline(title: string, source: string, companyName: string): string {
  const withoutMarkup = title.replace(/<[^>]*>/g, " ").replace(/https?:\/\/\S+|www\.\S+/gi, " ").replace(/\s+/g, " ").trim();
  const suffix = ` - ${source}`;
  const clean = withoutMarkup.toLocaleLowerCase("en").endsWith(suffix.toLocaleLowerCase("en"))
    ? withoutMarkup.slice(0, -suffix.length).trim()
    : withoutMarkup;
  return clean || `Última hora sobre ${companyName}`;
}

function displaySummary(summary: string | undefined): string | null {
  if (!summary || /<a\b|https?:\/\/|www\./i.test(summary)) return null;
  return summary.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || null;
}

export function CompanyNewsFeed({
  news,
  ticker,
  companyName,
}: {
  news: NewsItem[];
  ticker: string;
  companyName: string;
}) {
  const [filter, setFilter] = useState<"all" | "regulatory" | "market">("all");

  const filteredNews = useMemo(() => {
    if (filter === "regulatory") return news.filter((n) => n.isRegulatory);
    if (filter === "market") return news.filter((n) => !n.isRegulatory);
    return news;
  }, [news, filter]);

  const countRegulatory = news.filter((n) => n.isRegulatory).length;
  const countMarket = news.filter((n) => !n.isRegulatory).length;

  return (
    <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-6 space-y-6">
      {/* Cabecera del Feed de Noticias */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="size-4 text-periwinkle-glow" />
            <h3 className="font-display text-pure-white text-[18px] font-medium tracking-tight">
              Flujo de Noticias y Hechos Relevantes
            </h3>
          </div>
          <p className="text-muted-steel text-[13px] mt-0.5">
            Eventos corporativos oficiales ante la SEC (Form 8-K) y cobertura de prensa para {ticker} ({companyName}).
          </p>
        </div>

        {/* Píldoras de Filtro */}
        <div className="bg-void-black border-gunmetal inline-flex self-start rounded-full border p-1 sm:self-auto text-[12px] font-mono">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1 rounded-full transition-colors cursor-pointer",
              filter === "all" ? "bg-gunmetal text-pure-white font-medium" : "text-muted-steel hover:text-frost",
            )}
          >
            Todas ({news.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("regulatory")}
            className={cn(
              "px-3 py-1 rounded-full transition-colors cursor-pointer",
              filter === "regulatory" ? "bg-gunmetal text-pure-white font-medium" : "text-muted-steel hover:text-frost",
            )}
          >
            SEC 8-K ({countRegulatory})
          </button>
          <button
            type="button"
            onClick={() => setFilter("market")}
            className={cn(
              "px-3 py-1 rounded-full transition-colors cursor-pointer",
              filter === "market" ? "bg-gunmetal text-pure-white font-medium" : "text-muted-steel hover:text-frost",
            )}
          >
            Prensa ({countMarket})
          </button>
        </div>
      </div>

      {/* Lista de Noticias */}
      {filteredNews.length === 0 ? (
        <div className="border border-dashed border-gunmetal rounded-xl p-8 text-center">
          <p className="text-muted-steel text-[14px]">
            No hay noticias ni hechos registrados en esta categoría recientemente.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredNews.map((item, index) => {
            const headline = displayHeadline(item.title, item.source, companyName);
            const summary = displaySummary(item.summary);
            const featured = index === 0;
            return (
            <article
              key={item.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl border transition-all duration-200",
                featured
                  ? "border-periwinkle-glow/35 bg-gradient-to-br from-periwinkle-glow/[0.13] via-void-black/75 to-carbon-surface shadow-[0_18px_55px_rgba(0,0,0,0.22)]"
                  : "border-gunmetal bg-void-black/45 hover:border-periwinkle-glow/35 hover:bg-gunmetal/20",
              )}
            >
              <a href={item.url} target="_blank" rel="noreferrer noopener" className={cn("block", featured ? "p-5 sm:p-6" : "p-4 sm:p-5")} aria-label={`Leer: ${headline}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {featured ? <span className="rounded-full bg-periwinkle-glow px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-void-black">Destacada</span> : null}
                    {item.isRegulatory ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-periwinkle-glow/35 bg-periwinkle-glow/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-periwinkle-glow">
                        <ShieldCheck className="size-3" /> SEC 8-K oficial
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gunmetal bg-void-black/65 px-2.5 py-1 font-mono text-[10px] text-frost">
                        <Globe className="size-3 text-muted-steel" /> {item.source}
                      </span>
                    )}
                    {item.category === "earnings" ? <span className="rounded-full border border-emerald-800/40 bg-emerald-950/40 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-emerald-400">Resultados</span> : null}
                  </div>
                  <time dateTime={item.publishedAt} className="shrink-0 font-mono text-[10px] text-muted-steel">{formatNewsDate(item.publishedAt)}</time>
                </div>

                <h4 className={cn("mt-3 max-w-4xl font-display font-medium leading-[1.12] tracking-[-0.025em] text-pure-white transition-colors group-hover:text-periwinkle-glow", featured ? "text-[24px] sm:text-[29px]" : "text-[18px] sm:text-[20px]")}>
                  {headline}
                </h4>

                {summary ? <p className="mt-2 line-clamp-2 max-w-4xl text-[12px] leading-[1.55] text-frost/80 text-pretty">{summary}</p> : null}

                <div className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-periwinkle-glow">
                  Leer noticia completa
                  <ExternalLink className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </a>
            </article>
            );
          })}
        </div>
      )}

      {/* Pie de Garantía de Fuentes */}
      <div className="border-t border-gunmetal/60 pt-4 flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted-steel">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-periwinkle-glow" />
          Hechos regulatorios leídos directamente de la SEC y cobertura de medios financieros en tiempo real.
        </span>
        <span className="font-mono text-[11px]">Sin contenidos inventados</span>
      </div>
    </div>
  );
}
