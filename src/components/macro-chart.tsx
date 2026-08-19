"use client";

import { Area, AreaChart, ResponsiveContainer, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import type { FredPoint } from "@/lib/fred/client";

export function MacroChart({
  points,
  unidad,
  color = "var(--color-chart-1)",
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
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            minTickGap={44}
            tickFormatter={(v: string) => v.slice(0, 4)}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => v.toLocaleString("es-ES", { maximumFractionDigits: 1 })}
          />
          <ReferenceLine y={0} stroke="var(--color-border)" />
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--color-muted-foreground)" }}
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
