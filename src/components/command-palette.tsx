"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type Hit = { ticker: string; cik: string; name: string };
type IndexHit = { symbol: string; name: string; shortName: string; slug: string; provider: string };
type CommodityHit = { symbol: string; name: string; shortName: string; slug: string; unit: string };

/**
 * Buscador global. Se abre con Cmd+K, con Ctrl+K, o desde la cabecera mediante
 * el evento `altius:open-search`.
 */
export function CommandPalette() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState("");
  /** Los resultados se guardan junto a la consulta que los produjo. */
  const [resultado, setResultado] = useState<{
    q: string;
    hits: Hit[];
    indices: IndexHit[];
    commodities: CommodityHit[];
  }>({
    q: "",
    hits: [],
    indices: [],
    commodities: [],
  });

  const q = consulta.trim();
  const hits = resultado.q === q ? resultado.hits : [];
  const indices = resultado.q === q ? resultado.indices : [];
  const commodities = resultado.q === q ? resultado.commodities : [];
  const cargando = q !== "" && resultado.q !== q;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setAbierto((v) => !v);
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
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: control.signal,
        });
        const json = (await res.json()) as {
          results?: Hit[];
          indices?: IndexHit[];
          commodities?: CommodityHit[];
        };
        setResultado({
          q,
          hits: json.results ?? [],
          indices: json.indices ?? [],
          commodities: json.commodities ?? [],
        });
      } catch {
        // Petición cancelada al seguir escribiendo
      }
    }, 160);
    return () => {
      clearTimeout(t);
      control.abort();
    };
  }, [q]);

  const ir = useCallback(
    (ticker: string) => {
      setAbierto(false);
      setConsulta("");
      router.push(`/ticker/${ticker.toUpperCase()}`);
    },
    [router],
  );

  const irIndice = useCallback(
    (slug: string) => {
      setAbierto(false);
      setConsulta("");
      router.push(`/indices/${slug}`);
    },
    [router],
  );

  const irCommodity = useCallback(
    (slug: string) => {
      setAbierto(false);
      setConsulta("");
      router.push(`/commodities/${slug}`);
    },
    [router],
  );

  return (
    <CommandDialog
      open={abierto}
      onOpenChange={setAbierto}
      title="Buscar empresa, índice o materia prima"
      description="Busca por ticker, índice europeo/global, materia prima o empresa en el registro de la SEC"
    >
      <Command>
        <CommandInput
          placeholder="Busca por ticker, índice o materia prima — Oro, Brent, DAX, IBEX, ASML, AAPL…"
          value={consulta}
          onValueChange={setConsulta}
        />
        <CommandList>
          {!q ? (
            <div className="text-muted-foreground px-4 py-8 text-center text-sm">
              <Search className="mx-auto mb-2 size-5 opacity-40" />
              Más de 10.000 empresas registradas en la SEC, selectivos europeos e internacionales y materias primas.
            </div>
          ) : cargando && hits.length === 0 && indices.length === 0 && commodities.length === 0 ? (
            <div className="text-muted-foreground px-4 py-8 text-center text-sm">
              Buscando…
            </div>
          ) : (
            <>
              <CommandEmpty>Sin resultados para «{q}».</CommandEmpty>

              {commodities.length > 0 && (
                <CommandGroup heading="Materias Primas (Commodities)">
                  {commodities.map((com) => (
                    <CommandItem
                      key={com.symbol}
                      value={`${com.symbol} ${com.shortName} ${com.name} materia prima commodity`}
                      onSelect={() => irCommodity(com.slug)}
                      className="flex items-center gap-3 py-2 cursor-pointer"
                    >
                      <span className="bg-void-black text-amber-300 border border-amber-500/40 min-w-16 rounded px-2 py-0.5 text-center font-mono text-xs font-semibold">
                        {com.shortName}
                      </span>
                      <span className="truncate text-sm text-pure-white font-medium">{com.name}</span>
                      <span className="text-muted-steel ml-auto font-mono text-[11px]">
                        {com.unit}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {indices.length > 0 && (
                <CommandGroup heading="Índices Bursátiles">
                  {indices.map((idx) => (
                    <CommandItem
                      key={idx.symbol}
                      value={`${idx.symbol} ${idx.shortName} ${idx.name} indice`}
                      onSelect={() => irIndice(idx.slug)}
                      className="flex items-center gap-3 py-2 cursor-pointer"
                    >
                      <span className="bg-void-black text-periwinkle-glow border border-periwinkle-glow/40 min-w-16 rounded px-2 py-0.5 text-center font-mono text-xs font-semibold">
                        {idx.shortName}
                      </span>
                      <span className="truncate text-sm text-pure-white font-medium">{idx.name}</span>
                      <span className="text-muted-steel ml-auto font-mono text-[11px]">
                        ÍNDICE
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {hits.length > 0 && (
                <CommandGroup heading="Empresas (SEC)">
                  {hits.map((h) => (
                    <CommandItem
                      key={h.cik + h.ticker}
                      value={`${h.ticker} ${h.name}`}
                      onSelect={() => ir(h.ticker)}
                      className="flex items-center gap-3 py-2 cursor-pointer"
                    >
                      <span className="bg-void-black text-periwinkle-glow border border-gunmetal min-w-14 rounded px-2 py-0.5 text-center font-mono text-xs font-semibold">
                        {h.ticker}
                      </span>
                      <span className="truncate text-sm text-pure-white font-medium">{h.name}</span>
                      <span className="text-muted-steel ml-auto font-mono text-[11px]">
                        CIK {h.cik}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
