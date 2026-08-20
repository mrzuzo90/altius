"use client";

import { Search } from "lucide-react";

export function HomeSearch() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("altius:open-search"))}
      className="bg-void-black border-gunmetal text-muted-steel hover:border-steel-border/50 hover:text-frost flex w-full items-center gap-3 rounded-[10px] border px-4 py-3 text-left text-[15px] transition-all shadow-xs"
    >
      <Search className="text-muted-steel size-4 shrink-0" />
      <span className="truncate">Busca por ticker o razón social (AAPL, MSFT, NVDA…)</span>
      <kbd className="border-gunmetal bg-carbon-surface text-muted-steel ml-auto rounded px-1.5 py-0.5 text-[11px] font-mono border">⌘K</kbd>
    </button>
  );
}
