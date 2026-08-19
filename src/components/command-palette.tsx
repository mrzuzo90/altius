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

/**
 * Buscador global. Se abre con Cmd+K, con Ctrl+K, o desde la cabecera mediante
 * el evento `altius:open-search`.
 */
export function CommandPalette() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [cargando, setCargando] = useState(false);

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
    const q = consulta.trim();
    if (!q) {
      setHits([]);
      return;
    }
    setCargando(true);
    const control = new AbortController();
    // Antirrebote: el índice de la SEC son 10.000 entradas y no hace falta
    // consultarlo en cada pulsación.
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: control.signal,
        });
        const json = (await res.json()) as { results?: Hit[] };
        setHits(json.results ?? []);
      } catch {
        // Petición cancelada al seguir escribiendo: no es un error.
      } finally {
        setCargando(false);
      }
    }, 160);
    return () => {
      clearTimeout(t);
      control.abort();
    };
  }, [consulta]);

  const ir = useCallback(
    (ticker: string) => {
      setAbierto(false);
      setConsulta("");
      router.push(`/ticker/${ticker.toUpperCase()}`);
    },
    [router],
  );

  return (
    <CommandDialog
      open={abierto}
      onOpenChange={setAbierto}
      title="Buscar empresa"
      description="Busca por ticker o por razón social en el registro de la SEC"
    >
      {/* El filtrado ya lo hace el índice de la SEC en el servidor; el filtro
          interno de cmdk volvería a filtrar y ocultaría resultados válidos. */}
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Busca por ticker o nombre — AAPL, Johnson, Tesla…"
          value={consulta}
          onValueChange={setConsulta}
        />
        <CommandList>
          {!consulta.trim() ? (
            <div className="text-muted-foreground px-4 py-8 text-center text-sm">
              <Search className="mx-auto mb-2 size-5 opacity-40" />
              Más de 10.000 empresas registradas en la SEC.
            </div>
          ) : cargando && hits.length === 0 ? (
            <div className="text-muted-foreground px-4 py-8 text-center text-sm">
              Buscando…
            </div>
          ) : (
            <>
              <CommandEmpty>Sin resultados para «{consulta}».</CommandEmpty>
              <CommandGroup heading="Empresas">
                {hits.map((h) => (
                  <CommandItem
                    key={h.cik + h.ticker}
                    value={h.ticker}
                    onSelect={() => ir(h.ticker)}
                    className="flex items-center gap-3"
                  >
                    <span className="bg-muted text-foreground min-w-14 rounded px-1.5 py-0.5 text-center font-mono text-xs font-semibold">
                      {h.ticker}
                    </span>
                    <span className="truncate text-sm">{h.name}</span>
                    <span className="text-muted-foreground ml-auto font-mono text-[11px]">
                      CIK {h.cik}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
