"use client";

import { Search } from "lucide-react";

export function HomeSearch() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("altius:open-search"))}
      className="border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted hover:border-border mx-auto flex w-full max-w-md items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors"
    >
      <Search className="size-4 shrink-0" />
      <span>Busca por ticker o razón social…</span>
      <kbd className="border-border/60 bg-background ml-auto rounded border px-1.5 py-0.5 font-mono text-[10px]">
        ⌘K
      </kbd>
    </button>
  );
}
