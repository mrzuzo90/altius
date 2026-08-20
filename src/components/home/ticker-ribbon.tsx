"use client";

import Link from "next/link";
import { MARKET_LEADERS } from "@/lib/home/leaders-data";
import { Sparkline } from "@/components/sparkline";
import { TrendingUp, TrendingDown } from "lucide-react";

export function TickerRibbon() {
  const items = [...MARKET_LEADERS, ...MARKET_LEADERS];

  return (
    <div className="bg-carbon-surface/80 border-b border-gunmetal overflow-hidden py-2 backdrop-blur-sm">
      <div className="flex w-max animate-[scroll_50s_linear_infinite] hover:[animation-play-state:paused]">
        {items.map((item, idx) => {
          const isUp = item.changePct >= 0;
          return (
            <Link
              key={`${item.ticker}-${idx}`}
              href={`/ticker/${item.ticker}`}
              className="flex items-center gap-3 px-6 border-r border-gunmetal/60 hover:bg-gunmetal/40 transition-colors py-1 group"
            >
              <span className="font-mono font-bold text-[13px] text-pure-white group-hover:text-periwinkle-glow transition-colors">
                {item.ticker}
              </span>
              <span className="font-mono text-[13px] text-frost tabular">
                ${item.price.toFixed(2)}
              </span>
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
              <div className="w-12 h-4 hidden sm:block opacity-60 group-hover:opacity-100 transition-opacity">
                <Sparkline values={item.trend} color={isUp ? "#34d399" : "#f87171"} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
