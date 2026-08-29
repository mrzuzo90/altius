"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  BarChart3,
  Building2,
  CornerDownLeft,
  Gem,
  Search,
  Sparkles,
} from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { RankedSearchResult, SearchResultKind } from "@/lib/search/ranking";

const RESULT_APPEARANCE: Record<
  SearchResultKind,
  { label: string; badge: string; icon: typeof Building2 }
> = {
  company: {
    label: "Empresa",
    badge: "border-periwinkle-glow/35 bg-periwinkle-glow/10 text-periwinkle-glow",
    icon: Building2,
  },
  index: {
    label: "Índice",
    badge: "border-sky-400/35 bg-sky-400/10 text-sky-300",
    icon: BarChart3,
  },
  commodity: {
    label: "Materia prima",
    badge: "border-amber-400/35 bg-amber-400/10 text-amber-300",
    icon: Gem,
  },
  currency: {
    label: "Divisa",
    badge: "border-emerald-400/35 bg-emerald-400/10 text-emerald-300",
    icon: ArrowRightLeft,
  },
};

/**
 * Buscador global. Se abre con Cmd+K, con Ctrl+K, o desde la cabecera mediante
 * el evento `altius:open-search`.
 */
export function CommandPalette() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [resultado, setResultado] = useState<{ q: string; ranked: RankedSearchResult[] }>({
    q: "",
    ranked: [],
  });

  const q = consulta.trim();
  const ranked = resultado.q === q ? resultado.ranked : [];
  const cargando = q !== "" && resultado.q !== q;
  const directTicker = /^[A-Za-z0-9^.\-]{1,18}$/.test(q) ? q.toUpperCase() : null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setAbierto((current) => !current);
      }
    };
    const onOpen = () => setAbierto(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("altius:open-search", onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("altius:open-search", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!q) return;
    const control = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: control.signal,
        });
        const json = (await response.json()) as { ranked?: RankedSearchResult[] };
        setResultado({ q, ranked: json.ranked ?? [] });
      } catch {
        // Petición cancelada al seguir escribiendo.
      }
    }, 140);
    return () => {
      clearTimeout(timer);
      control.abort();
    };
  }, [q]);

  const ir = useCallback(
    (href: string) => {
      setAbierto(false);
      setConsulta("");
      router.push(href);
    },
    [router],
  );

  return (
    <CommandDialog
      open={abierto}
      onOpenChange={setAbierto}
      title="Buscar empresas y mercados"
      description="Resultados globales ordenados por coincidencia y relevancia"
      className="sm:max-w-2xl"
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Escribe una empresa o ticker — Apple, AAPL, Inditex, ASML…"
          value={consulta}
          onValueChange={setConsulta}
        />
        <CommandList className="max-h-[min(65vh,32rem)]">
          {!q ? (
            <div className="text-muted-foreground px-5 py-10 text-center text-sm">
              <Search className="mx-auto mb-3 size-5 opacity-40" />
              <p className="text-frost font-medium">¿Qué quieres analizar?</p>
              <p className="mt-1 text-xs">
                Busca por nombre habitual o ticker. También puedes encontrar índices, divisas y materias primas.
              </p>
            </div>
          ) : cargando ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 px-4 py-10 text-sm">
              <span className="border-periwinkle-glow size-4 animate-spin rounded-full border-2 border-r-transparent" />
              Ordenando los resultados más relevantes…
            </div>
          ) : ranked.length > 0 ? (
            <CommandGroup heading="Mejores resultados · ordenados por relevancia" className="px-1 pb-2">
              {ranked.map((item, index) => {
                const appearance = RESULT_APPEARANCE[item.kind];
                const Icon = appearance.icon;
                const isBest = index === 0;
                return (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => ir(item.href)}
                    className={
                      isBest
                        ? "border-periwinkle-glow/25 bg-periwinkle-glow/[0.07] mb-1.5 min-h-16 cursor-pointer border px-3 py-2.5"
                        : "min-h-14 cursor-pointer border border-transparent px-3 py-2"
                    }
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${appearance.badge}`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="text-pure-white truncate text-sm font-semibold">{item.name}</span>
                        {isBest ? (
                          <span className="bg-periwinkle-glow/15 text-periwinkle-glow border-periwinkle-glow/20 hidden shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:flex">
                            <Sparkles className="size-3" />
                            Mejor coincidencia
                          </span>
                        ) : null}
                      </span>
                      <span className="text-muted-steel mt-0.5 flex items-center gap-1.5 truncate text-[11px]">
                        <span className="font-mono font-semibold text-frost">{item.shortName ?? item.symbol}</span>
                        <span aria-hidden="true">·</span>
                        <span>{appearance.label}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{item.meta}</span>
                      </span>
                    </span>
                    <CornerDownLeft className="text-muted-steel size-3.5 opacity-0 transition-opacity group-data-selected/command-item:opacity-100" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ) : directTicker ? (
            <CommandGroup heading="Ticker internacional">
              <CommandItem
                value={`direct:${directTicker}`}
                onSelect={() => ir(`/ticker/${directTicker}`)}
                className="min-h-14 cursor-pointer gap-3 px-3 py-2"
              >
                <span className="border-periwinkle-glow/35 bg-periwinkle-glow/10 text-periwinkle-glow flex size-9 items-center justify-center rounded-lg border">
                  <Building2 className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-pure-white block text-sm font-semibold">Abrir {directTicker}</span>
                  <span className="text-muted-steel block text-[11px]">
                    No está en el índice, pero puedes consultar el ticker directamente.
                  </span>
                </span>
              </CommandItem>
            </CommandGroup>
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="text-frost text-sm font-medium">No encontramos «{q}»</p>
              <p className="text-muted-steel mt-1 text-xs">Prueba con el ticker o con un nombre más corto.</p>
            </div>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
