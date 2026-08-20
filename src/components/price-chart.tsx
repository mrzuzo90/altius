"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import type { PricePoint } from "@/lib/prices/types";

const RANGOS = [
  { id: "1a", label: "1 año", dias: 365 },
  { id: "5a", label: "5 años", dias: 365 * 5 },
  { id: "max", label: "Máx", dias: Number.POSITIVE_INFINITY },
] as const;

export function PriceChart({ points, source }: { points: PricePoint[]; source: string }) {
  const [rango, setRango] = useState<(typeof RANGOS)[number]["id"]>("5a");

  const datos = useMemo(() => {
    const def = RANGOS.find((r) => r.id === rango)!;
    if (!Number.isFinite(def.dias)) return points;
    const ultimoPunto = points.at(-1);
    if (!ultimoPunto) return points;
    // El rango se mide desde la última observación y no desde el reloj: así el
    // cálculo es puro, y si la serie llega con retraso «1 año» sigue siendo un
    // año de datos en lugar de un tramo recortado por el hueco.
    const corte = Date.parse(ultimoPunto.date) - def.dias * 86_400_000;
    return points.filter((p) => Date.parse(p.date) >= corte);
  }, [points, rango]);

  const primero = datos[0]?.close ?? 0;
  const ultimo = datos.at(-1)?.close ?? 0;
  const sube = ultimo >= primero;
  const variacion = primero !== 0 ? ((ultimo - primero) / primero) * 100 : 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline gap-3">
        <span className="tabular font-display text-graphite text-[40px] leading-[1.2] tracking-[-0.8px]">
          {ultimo.toLocaleString("es-ES", { style: "currency", currency: "USD" })}
        </span>
        <span className="tabular text-steel text-[14px]">
          {sube ? "+" : "−"}
          {Math.abs(variacion).toLocaleString("es-ES", { maximumFractionDigits: 1 })} % en el periodo
        </span>
        <div className="bg-ash ml-auto inline-flex rounded-[200px] p-1">
          {RANGOS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRango(r.id)}
              className={cn(
                "font-display rounded-[200px] px-3.5 py-1.5 text-[13px] tracking-[-0.02em] transition-colors",
                rango === r.id ? "bg-canvas-white text-graphite" : "text-slate hover:text-graphite",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={datos} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="grad-precio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-ember)" stopOpacity={0.16} />
                <stop offset="100%" stopColor="var(--color-ember)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--color-slate)" }}
              tickLine={false}
              axisLine={false}
              minTickGap={48}
              tickFormatter={(v: string) => v.slice(0, 7)}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 11, fill: "var(--color-slate)" }}
              tickLine={false}
              axisLine={false}
              width={54}
              tickFormatter={(v: number) => `$${v.toLocaleString("es-ES", { maximumFractionDigits: 0 })}`}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-canvas-white)",
                border: "1px solid var(--color-mist)",
                borderRadius: 8, boxShadow: "none",
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--color-slate)" }}
              formatter={(v) => [
                Number(v).toLocaleString("es-ES", { style: "currency", currency: "USD" }),
                "Cierre",
              ]}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke="var(--color-ember)"
              strokeWidth={1.6}
              fill="url(#grad-precio)"
              isAnimationActive={false}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-slate mt-3 text-[12px]">Cierres semanales · {source}</p>
    </div>
  );
}
