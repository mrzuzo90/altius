"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialTable } from "./financial-table";
import { SCALES, type Scale } from "@/lib/format";
import { cn } from "@/lib/utils";
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
  const [scale, setScale] = useState<Scale>("millions");

  return (
    <Tabs defaultValue="income" className="gap-5">
      <div className="flex flex-wrap items-center gap-4">
        {/* La píldora se desborda a 375 px y recortaba la última pestaña.
            Se le da scroll propio en lugar de dejar que corte el contenido. */}
        <TabsList className="bg-ash max-w-full justify-start overflow-x-auto rounded-[200px] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {bundle.blocks.map((b) => (
            <TabsTrigger
              key={b.id}
              value={b.id}
              className="font-display shrink-0 rounded-[200px] px-4 text-[14px] tracking-[-0.02em]"
            >
              {b.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="ml-auto flex flex-wrap items-center gap-3">
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

      <p className="text-steel max-w-3xl text-[13px] leading-[1.5]">
        Cifras en {SCALES[scale].label} de dólares salvo datos por acción. Las celdas subrayadas con
        puntos las calcula Altius; el resto procede literalmente del XBRL de la SEC. Una raya
        significa que la empresa no reporta ese concepto.
      </p>

      {bundle.blocks.map((b) => (
        <TabsContent key={b.id} value={b.id}>
          {/* La `key` fuerza el remontaje al cambiar de frecuencia o escala,
              lo que vuelve a disparar la animación CSS de entrada. */}
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
    <div className="bg-ash inline-flex rounded-[200px] p-1">
      {opciones.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            "font-display rounded-[200px] px-3.5 py-1.5 text-[13px] tracking-[-0.02em] transition-colors",
            valor === o.v ? "bg-canvas-white text-graphite" : "text-slate hover:text-graphite",
          )}
        >
          {o.t}
        </button>
      ))}
    </div>
  );
}
