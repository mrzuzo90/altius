"use client";

import Link from "next/link";
import { Search } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight">Altius</span>
          <span className="text-muted-foreground hidden text-[11px] tracking-wide sm:inline">
            análisis fundamental
          </span>
        </Link>

        <nav className="text-muted-foreground flex items-center gap-4 text-sm">
          <Link href="/macro" className="hover:text-foreground transition-colors">
            Macro
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("altius:open-search"))}
          className="border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground ml-auto flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors"
        >
          <Search className="size-3.5" />
          <span className="hidden sm:inline">Buscar empresa</span>
          <kbd className="border-border/60 bg-background hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
}
