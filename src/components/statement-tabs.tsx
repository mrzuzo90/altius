"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
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
    <Tabs defaultValue="income" className="gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <TabsList>
          {bundle.blocks.map((b) => (
            <TabsTrigger key={b.id} value={b.id}>
              {b.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="ml-auto flex flex-wrap items-center gap-2">
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

      <p className="text-muted-foreground text-xs">
        Cifras en {SCALES[scale].label} de dólares salvo datos por acción. Las celdas subrayadas con
        puntos las calcula Altius; el resto procede literalmente del XBRL de la SEC. Una raya
        significa que la empresa no reporta ese concepto.
      </p>

      {bundle.blocks.map((b) => (
        <TabsContent key={b.id} value={b.id}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${b.id}-${frequency}-${scale}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FinancialTable periods={b.periods} rows={b.rows} scale={scale} />
            </motion.div>
          </AnimatePresence>
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
    <div className="border-border/60 bg-muted/30 inline-flex rounded-md border p-0.5">
      {opciones.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            valor === o.v
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.t}
        </button>
      ))}
    </div>
  );
}
