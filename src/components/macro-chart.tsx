"use client";

import { Area, AreaChart, ResponsiveContainer, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import type { FredPoint } from "@/lib/fred/client";

export function MacroChart({
  points,
  unidad,
  color = "var(--color-ember)",
}: {
  points: FredPoint[];
  unidad: string;
  color?: string;
}) {
  const id = `grad-${unidad.replace(/\W/g, "")}-${color.replace(/\W/g, "")}`;
  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.16} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#646e87" }}
            tickLine={false}
            axisLine={false}
            minTickGap={44}
            tickFormatter={(v: string) => v.slice(0, 4)}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#646e87" }}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => v.toLocaleString("es-ES", { maximumFractionDigits: 1 })}
          />
          <ReferenceLine y={0} stroke="#1f2433" />
          <Tooltip
            contentStyle={{
              background: "#151621",
              border: "1px solid #1f2433",
              borderRadius: 10,
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              fontSize: 12,
              color: "#ffffff",
            }}
            labelStyle={{ color: "#c9d3ee", fontWeight: 500 }}
            formatter={(v) => [
              `${Number(v).toLocaleString("es-ES", { maximumFractionDigits: 2 })} ${unidad}`,
              "",
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.6}
            fill={`url(#${id})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
