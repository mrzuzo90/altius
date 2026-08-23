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
        <div className="divide-y divide-gunmetal/60">
          {filteredNews.map((item) => (
            <article
              key={item.id}
              className="py-4 first:pt-0 last:pb-0 group transition-colors"
            >
              <div className="flex items-baseline justify-between gap-4 mb-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  {item.isRegulatory ? (
                    <span className="bg-periwinkle-glow/15 border border-periwinkle-glow/40 text-periwinkle-glow font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <ShieldCheck className="size-3" />
                      SEC Form 8-K Oficial
                    </span>
                  ) : (
                    <span className="bg-void-black border border-gunmetal text-muted-steel font-mono text-[11px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Globe className="size-3 text-muted-steel" />
                      {item.source}
                    </span>
                  )}

                  {item.category === "earnings" && (
                    <span className="bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 font-mono text-[10px] uppercase px-1.5 py-0.5 rounded">
                      Resultados
                    </span>
                  )}
                </div>

                <time
                  dateTime={item.publishedAt}
                  className="font-mono text-[12px] text-muted-steel shrink-0"
                >
                  {formatNewsDate(item.publishedAt)}
                </time>
              </div>

              <h4 className="text-[15px] font-medium text-pure-white group-hover:text-periwinkle-glow transition-colors leading-snug">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 hover:underline"
                >
                  <span>{item.title}</span>
                  <ExternalLink className="size-3.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
              </h4>

              {item.summary && (
                <p className="text-frost/80 text-[13px] leading-[1.5] mt-1.5 line-clamp-2 text-pretty">
                  {item.summary}
                </p>
              )}
            </article>
          ))}
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
