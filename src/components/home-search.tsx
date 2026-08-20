"use client";

import { Search } from "lucide-react";

export function HomeSearch() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("altius:open-search"))}
      className="border-mist bg-fog text-slate hover:border-graphite/30 flex w-full items-center gap-3 border px-4 py-3.5 text-left text-[15px] transition-colors"
    >
      <Search className="size-4 shrink-0" />
      <span>Busca por ticker o razón social…</span>
      <kbd className="text-slate ml-auto text-[11px]">⌘K</kbd>
    </button>
  );
}
