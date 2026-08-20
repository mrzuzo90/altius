"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Observatorio" },
  { href: "/macro", label: "Macro" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-canvas-white sticky top-0 z-40">
      <div className="mx-auto flex h-20 max-w-[1200px] items-center gap-5 px-5">
        <Link href="/" className="font-display text-graphite text-[22px] tracking-[-0.02em]">
          Altius
        </Link>

        {/* Píldora de navegación: Ash, radio completo, sin sombra. */}
        <nav className="bg-ash mx-auto hidden items-center gap-5 rounded-[200px] px-[18px] py-2 sm:flex">
          {NAV.map((n) => {
            const activo = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "font-display text-[15px] tracking-[-0.02em] transition-colors",
                  activo ? "text-graphite" : "text-slate hover:text-graphite",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("altius:open-search"))}
          className="bg-graphite font-display ml-auto flex items-center gap-2 px-5 py-2.5 text-[15px] leading-none tracking-[-0.02em] text-white transition-opacity hover:opacity-85"
        >
          <Search className="size-3.5" />
          <span className="hidden sm:inline">Buscar empresa</span>
          <kbd className="hidden font-sans text-[11px] opacity-60 sm:inline">⌘K</kbd>
        </button>
      </div>
    </header>
  );
}
