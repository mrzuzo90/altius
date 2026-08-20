"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialTable } from "./financial-table";
import { SCALES, type Scale, formatValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";
import type { StatementBundle } from "@/lib/sec/statements";

export function StatementTabs({
  bundle,
  frequency,
  onFrequencyChange,
}: {
  bundle: StatementBundle;
  frequency: "annual" | "quarterly";
  onFrequencyChange: (f: "annual" | "quarterly") => void;
}) {
  const [tabActiva, setTabActiva] = useState<string>("income");
  const [scale, setScale] = useState<Scale>("millions");
  const [copiado, setCopiado] = useState(false);

  const copiarTabla = useCallback(() => {
    const block = bundle.blocks.find((b) => b.id === tabActiva) ?? bundle.blocks[0];
    if (!block || block.periods.length === 0) return;

    const cabecera = ["Concepto", ...block.periods.map((p) => p.label)].join("\t");
    const filas = block.rows.map((r) => {
      const valores = block.periods.map((p) => {
        const val = r.cells[p.key]?.value;
        if (val === null || val === undefined) return "";
        return formatValue(val, r.line.unit, scale);
      });
      return [r.line.label, ...valores].join("\t");
    });

    const tsv = [cabecera, ...filas].join("\n");
    navigator.clipboard.writeText(tsv);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }, [bundle, tabActiva, scale]);

  return (
    <Tabs value={tabActiva} onValueChange={setTabActiva} className="gap-5">
      <div className="flex flex-wrap items-center gap-4">
        {/* Píldora de navegación de pestañas estilo Better Stack */}
        <TabsList className="bg-carbon-surface border-gunmetal max-w-full justify-start overflow-x-auto rounded-full border p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {bundle.blocks.map((b) => (
            <TabsTrigger
              key={b.id}
              value={b.id}
              className="font-display shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium tracking-tight data-[state=active]:bg-gunmetal data-[state=active]:text-white text-muted-steel hover:text-frost transition-colors"
            >
              {b.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={copiarTabla}
            title="Copiar tabla para pegar en Excel o Google Sheets"
            className="border-gunmetal bg-carbon-surface hover:border-steel-border/50 text-muted-steel hover:text-white font-display flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all shadow-xs"
          >
            {copiado ? (
              <>
                <Check className="size-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copiada</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5 text-muted-steel" />
                <span>Copiar tabla</span>
              </>
            )}
          </button>

          <Conmutador
            valor={frequency}
            opciones={[
              { v: "annual", t: "Anual" },
              { v: "quarterly", t: "Trimestral" },
            ]}
            onChange={(v) => onFrequencyChange(v as "annual" | "quarterly")}
          />
          <Conmutador
            valor={scale}
            opciones={(Object.keys(SCALES) as Scale[]).map((s) => ({
              v: s,
              t: s === "thousands" ? "Miles" : s === "millions" ? "Millones" : "Miles M",
            }))}
            onChange={(v) => setScale(v as Scale)}
          />
        </div>
      </div>

      <p className="text-muted-steel max-w-3xl text-[13px] leading-[1.5]">
        Cifras en {SCALES[scale].label} de dólares salvo datos por acción y ratios porcentuales. Las
        celdas marcadas las calcula Altius; el resto procede literalmente del XBRL de la
        SEC. Una raya significa que la empresa no reporta ese concepto.
      </p>

      {bundle.blocks.map((b) => (
        <TabsContent key={b.id} value={b.id}>
          <div
            key={`${b.id}-${frequency}-${scale}`}
            className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
          >
            <FinancialTable periods={b.periods} rows={b.rows} scale={scale} />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

function Conmutador({
  valor,
  opciones,
  onChange,
}: {
  valor: string;
  opciones: { v: string; t: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="bg-carbon-surface border-gunmetal inline-flex rounded-full border p-1">
      {opciones.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            "font-display rounded-full px-3 py-1 text-[12px] font-medium tracking-tight transition-colors",
            valor === o.v ? "bg-gunmetal text-pure-white" : "text-muted-steel hover:text-frost",
          )}
        >
          {o.t}
        </button>
      ))}
    </div>
  );
}
