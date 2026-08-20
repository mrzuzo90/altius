"use client";

import { useState } from "react";
import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";

type PreviewCompany = {
  ticker: string;
  name: string;
  price: number;
  marketCap: string;
  ev: string;
  pe: number;
  evEbitda: number;
  roic: number;
  fcfConversion: number;
  points: { date: string; close: number }[];
  checks: { name: string; status: "pass" | "warn"; value: string }[];
};

const PREVIEW_DATA: Record<string, PreviewCompany> = {
  NVDA: {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    price: 128.40,
    marketCap: "$3.15 T",
    ev: "$3.12 T",
    pe: 42.5,
    evEbitda: 34.8,
    roic: 68.4,
    fcfConversion: 88.5,
    points: [
      { date: "2023-01", close: 18.5 },
      { date: "2023-04", close: 27.2 },
      { date: "2023-07", close: 45.0 },
      { date: "2023-10", close: 41.5 },
      { date: "2024-01", close: 62.0 },
      { date: "2024-04", close: 88.0 },
      { date: "2024-07", close: 118.0 },
      { date: "2024-10", close: 135.0 },
      { date: "2025-01", close: 128.4 },
    ],
    checks: [
      { name: "ROIC > 15%", status: "pass", value: "68.4 %" },
      { name: "Pricing Power (Márgenes > 40%)", status: "pass", value: "Bruto 75.0%" },
      { name: "Fortaleza Balance", status: "pass", value: "Caja Neta" },
      { name: "Conversión FCF > 65%", status: "pass", value: "88.5 %" },
      { name: "Crecimiento YoY > 8%", status: "pass", value: "+94.2 %" },
      { name: "Recompras de Acciones", status: "pass", value: "-1.8 % / año" },
    ],
  },
  AAPL: {
    ticker: "AAPL",
    name: "Apple Inc.",
    price: 232.15,
    marketCap: "$3.51 T",
    ev: "$3.55 T",
    pe: 33.8,
    evEbitda: 25.4,
    roic: 56.4,
    fcfConversion: 82.0,
    points: [
      { date: "2023-01", close: 140.0 },
      { date: "2023-04", close: 165.0 },
      { date: "2023-07", close: 190.0 },
      { date: "2023-10", close: 172.0 },
      { date: "2024-01", close: 185.0 },
      { date: "2024-04", close: 170.0 },
      { date: "2024-07", close: 225.0 },
      { date: "2024-10", close: 230.0 },
      { date: "2025-01", close: 232.15 },
    ],
    checks: [
      { name: "ROIC > 15%", status: "pass", value: "56.4 %" },
      { name: "Pricing Power (Márgenes > 40%)", status: "pass", value: "Bruto 46.2%" },
      { name: "Fortaleza Balance", status: "pass", value: "0.6x EBITDA" },
      { name: "Conversión FCF > 65%", status: "pass", value: "82.0 %" },
      { name: "Crecimiento YoY > 8%", status: "warn", value: "+6.2 %" },
      { name: "Recompras de Acciones", status: "pass", value: "-3.1 % / año" },
    ],
  },
  MSFT: {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    price: 418.90,
    marketCap: "$3.11 T",
    ev: "$3.15 T",
    pe: 34.2,
    evEbitda: 22.8,
    roic: 28.5,
    fcfConversion: 74.0,
    points: [
      { date: "2023-01", close: 245.0 },
      { date: "2023-04", close: 300.0 },
      { date: "2023-07", close: 340.0 },
      { date: "2023-10", close: 330.0 },
      { date: "2024-01", close: 400.0 },
      { date: "2024-04", close: 410.0 },
      { date: "2024-07", close: 440.0 },
      { date: "2024-10", close: 425.0 },
      { date: "2025-01", close: 418.9 },
    ],
    checks: [
      { name: "ROIC > 15%", status: "pass", value: "28.5 %" },
      { name: "Pricing Power (Márgenes > 40%)", status: "pass", value: "Bruto 69.8%" },
      { name: "Fortaleza Balance", status: "pass", value: "Caja Neta" },
      { name: "Conversión FCF > 65%", status: "pass", value: "74.0 %" },
      { name: "Crecimiento YoY > 8%", status: "pass", value: "+15.6 %" },
      { name: "Recompras de Acciones", status: "pass", value: "-0.8 % / año" },
    ],
  },
};

export function InteractivePreview() {
  const [selectedTicker, setSelectedTicker] = useState<string>("NVDA");
  const data = PREVIEW_DATA[selectedTicker] || PREVIEW_DATA.NVDA;

  return (
    <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gunmetal pb-5">
        <div>
          <span className="text-periwinkle-glow font-mono text-[11px] uppercase tracking-wider font-semibold">
            Previsualizador de Terminal
          </span>
          <h3 className="font-display text-pure-white text-[22px] font-medium tracking-tight mt-1">
            {data.name} ({data.ticker})
          </h3>
        </div>

        {/* Ticker selector buttons */}
        <div className="bg-void-black border-gunmetal inline-flex rounded-full border p-1">
          {(Object.keys(PREVIEW_DATA) as (keyof typeof PREVIEW_DATA)[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTicker(t)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-mono font-medium transition-colors ${
                selectedTicker === t
                  ? "bg-gunmetal text-pure-white shadow-xs"
                  : "text-muted-steel hover:text-frost"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Left column: Quality scorecard preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-frost text-[13px] font-medium">Checklist de Calidad Fundamental</span>
            <span className="text-periwinkle-glow bg-void-black border border-gunmetal text-[11px] font-mono px-2 py-0.5 rounded-full">
              6/6 Aprobados
            </span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {data.checks.map((c, i) => (
              <div key={i} className="bg-void-black border-gunmetal/80 rounded-xl border p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <span className="text-frost text-[12px]">{c.name}</span>
                </div>
                <span className="font-mono text-[12px] text-pure-white font-medium pl-2">
                  {c.value}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-void-black border-gunmetal rounded-xl border p-3 text-center">
              <p className="text-muted-steel text-[11px] font-mono uppercase">PER (LTM)</p>
              <p className="text-pure-white font-display text-[18px] font-semibold mt-1 tabular">{data.pe}x</p>
            </div>
            <div className="bg-void-black border-gunmetal rounded-xl border p-3 text-center">
              <p className="text-muted-steel text-[11px] font-mono uppercase">EV / EBITDA</p>
              <p className="text-pure-white font-display text-[18px] font-semibold mt-1 tabular">{data.evEbitda}x</p>
            </div>
            <div className="bg-void-black border-gunmetal rounded-xl border p-3 text-center">
              <p className="text-muted-steel text-[11px] font-mono uppercase">ROIC</p>
              <p className="text-emerald-400 font-display text-[18px] font-semibold mt-1 tabular">{data.roic}%</p>
            </div>
          </div>
        </div>

        {/* Right column: Area chart */}
        <div className="bg-void-black border-gunmetal rounded-xl border p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-muted-steel text-[11px] font-mono">Cotización 2 Años</span>
              <div className="font-display text-pure-white text-[24px] font-semibold tabular mt-0.5">
                ${data.price.toFixed(2)}
              </div>
            </div>
            <span className="text-muted-steel font-mono text-[11px]">
              Cap: {data.marketCap}
            </span>
          </div>

          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.points} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`grad-preview-${data.ticker}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#98a4f7" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#98a4f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#646e87" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10, fill: "#646e87" }}
                  tickLine={false}
                  axisLine={false}
                  width={38}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#151621",
                    border: "1px solid #1f2433",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#ffffff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="#98a4f7"
                  strokeWidth={1.8}
                  fill={`url(#grad-preview-${data.ticker})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gunmetal/60 pt-3">
            <Link
              href={`/ticker/${data.ticker}/financials`}
              className="text-periwinkle-glow hover:underline inline-flex items-center gap-1 text-[13px] font-medium"
            >
              <span>Abrir Estados Financieros ({data.ticker})</span>
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href={`/ticker/${data.ticker}/valuation`}
              className="text-muted-steel hover:text-frost inline-flex items-center gap-1 text-[12px] font-mono"
            >
              <span>Calculadora DCF</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
