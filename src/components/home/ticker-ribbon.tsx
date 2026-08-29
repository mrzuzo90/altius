"use client";

import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";

export type RibbonItem = {
  type: "stock" | "index" | "commodity";
  ticker: string;
  price: number;
  changePct: number | null;
  href: string;
  isVix?: boolean;
  unit?: string;
};

export function TickerRibbon({ items: providedItems }: { items?: RibbonItem[] }) {
  const baseItems = providedItems && providedItems.length > 0 ? providedItems : [];
  if (baseItems.length === 0) return null;

  const loopedItems = [...baseItems, ...baseItems];

  return (
    <div className="bg-carbon-surface/80 border-b border-gunmetal overflow-hidden py-2 backdrop-blur-sm">
      <div className="flex w-max animate-[scroll_55s_linear_infinite] hover:[animation-play-state:paused]">
        {loopedItems.map((item, idx) => {
          const isUp = item.changePct !== null && item.changePct >= 0;
          const isIndexOrCommodity = item.type === "index" || item.type === "commodity";

          return (
            <Link
              key={`${item.ticker}-${idx}`}
              href={item.href}
              className="flex items-center gap-3 px-5 border-r border-gunmetal/60 hover:bg-gunmetal/40 transition-colors py-1 group"
            >
              <span
                className={`font-mono font-bold text-[13px] transition-colors ${
                  isIndexOrCommodity
                    ? "text-amber-300 group-hover:text-amber-200"
                    : "text-pure-white group-hover:text-periwinkle-glow"
                }`}
              >
                {item.ticker}
              </span>
              <span className="font-mono text-[13px] text-frost tabular">
                {item.isVix
                  ? item.price.toFixed(2)
                  : `$${item.price.toLocaleString("es-ES", { maximumFractionDigits: 2 })}`}
              </span>
              {item.changePct !== null && (
                <span
                  className={`flex items-center gap-0.5 font-mono text-[11px] font-medium px-1.5 py-0.5 rounded ${
                    isUp
                      ? "text-emerald-400 bg-emerald-950/40 border border-emerald-800/40"
                      : "text-rose-400 bg-rose-950/40 border border-rose-800/40"
                  }`}
                >
                  {isUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {isUp ? "+" : ""}{item.changePct.toFixed(2)}%
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
