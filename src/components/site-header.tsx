"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/", label: "Observatorio" },
  { href: "/macro", label: "Macro" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-void-black/90 border-gunmetal sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-5">
        <Link href="/" className="font-display flex items-center gap-2 text-[19px] font-medium text-white tracking-[-0.01em]">
          <span className="size-2 rounded-full bg-periwinkle-glow shadow-[0_0_8px_rgba(152,164,247,0.8)]" />
          <span>Altius</span>
        </Link>

        {/* Píldora de navegación Better Stack: Carbon Surface, Gunmetal border */}
        <nav className="bg-carbon-surface border-gunmetal mx-auto hidden items-center gap-1 rounded-full border px-2 py-1 sm:flex">
          {NAV.map((n) => {
            const activo = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "font-display rounded-full px-4 py-1.5 text-[14px] font-medium transition-colors",
                  activo
                    ? "bg-gunmetal/80 text-white shadow-xs"
                    : "text-muted-steel hover:text-frost",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("altius:open-search"))}
            className="btn-primary-gradient font-display flex items-center gap-2 px-4 py-2 text-[14px] leading-none"
          >
            <Search className="size-3.5" />
            <span className="hidden sm:inline">Buscar empresa</span>
            <kbd className="hidden font-sans text-[11px] opacity-75 sm:inline">⌘K</kbd>
          </button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
