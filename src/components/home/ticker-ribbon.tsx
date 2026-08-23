"use client";

import Link from "next/link";
import { MARKET_LEADERS } from "@/lib/home/leaders-data";
import { TrendingUp, TrendingDown } from "lucide-react";

type RibbonItem =
  | { type: "stock"; ticker: string; price: number; changePct: number; href: string }
  | { type: "index" | "commodity"; ticker: string; price: number; changePct: number; href: string; isVix?: boolean; unit?: string };

const GLOBAL_RIBBON_ITEMS: RibbonItem[] = [
  // Índices EE. UU.
  { type: "index", ticker: "S&P 500", price: 5980.25, changePct: 0.72, href: "/indices/sp500" },
  { type: "index", ticker: "NASDAQ", price: 18940.10, changePct: 1.15, href: "/indices/nasdaq" },
  { type: "index", ticker: "DOW JONES", price: 43450.80, changePct: 0.38, href: "/indices/dow-jones" },
  { type: "index", ticker: "VIX", price: 15.20, changePct: -3.40, href: "/indices/vix", isVix: true },

  // Índices Europa
  { type: "index", ticker: "EURO STOXX 50", price: 4950.40, changePct: 0.85, href: "/indices/eurostoxx50" },
  { type: "index", ticker: "DAX 40", price: 18620.50, changePct: 0.92, href: "/indices/dax" },
  { type: "index", ticker: "IBEX 35", price: 11280.30, changePct: 1.05, href: "/indices/ibex35" },

  // Materias Primas
  { type: "commodity", ticker: "ORO", price: 2512.40, changePct: 0.65, href: "/commodities/oro" },
  { type: "commodity", ticker: "BRENT", price: 82.35, changePct: -0.45, href: "/commodities/brent" },
  { type: "commodity", ticker: "GAS NATURAL", price: 2.48, changePct: 2.10, href: "/commodities/gas-natural" },
  { type: "commodity", ticker: "COBRE", price: 9240.0, changePct: 1.30, href: "/commodities/cobre" },
];

export function TickerRibbon() {
  const stockItems: RibbonItem[] = MARKET_LEADERS.map((m) => ({
    type: "stock",
    ticker: m.ticker,
    price: m.price,
    changePct: m.changePct,
    href: `/ticker/${m.ticker}`,
  }));

  const allItems = [...GLOBAL_RIBBON_ITEMS, ...stockItems];
  const items = [...allItems, ...allItems];

  return (
    <div className="bg-carbon-surface/80 border-b border-gunmetal overflow-hidden py-2 backdrop-blur-sm">
      <div className="flex w-max animate-[scroll_55s_linear_infinite] hover:[animation-play-state:paused]">
        {items.map((item, idx) => {
          const isUp = item.changePct >= 0;
          const isIndex = item.type === "index";

          return (
            <Link
              key={`${item.ticker}-${idx}`}
              href={item.href}
              className="flex items-center gap-3 px-5 border-r border-gunmetal/60 hover:bg-gunmetal/40 transition-colors py-1 group"
            >
              <span
                className={`font-mono font-bold text-[13px] transition-colors ${
                  isIndex
                    ? "text-amber-300 group-hover:text-amber-200"
                    : "text-pure-white group-hover:text-periwinkle-glow"
                }`}
              >
                {item.ticker}
              </span>
              <span className="font-mono text-[13px] text-frost tabular">
                {item.type === "index" && item.isVix
                  ? item.price.toFixed(2)
                  : `$${item.price.toFixed(2)}`}
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
            </Link>
          );
        })}
      </div>
    </div>
  );
}
