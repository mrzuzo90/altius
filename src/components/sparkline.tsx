"use client";

export function Sparkline({
  values,
  color = "var(--color-slate)",
}: {
  values: (number | null)[];
  color?: string;
}) {
  // Los valores llegan en orden inverso (más reciente primero); invertimos para orden cronológico
  const validos = [...values].reverse().filter((v): v is number => v !== null && Number.isFinite(v));

  if (validos.length < 2) {
    return <div className="w-[60px] text-center text-slate/40 text-[11px]">—</div>;
  }

  const width = 64;
  const height = 18;
  const padding = 2;

  const min = Math.min(...validos);
  const max = Math.max(...validos);
  const range = max - min === 0 ? 1 : max - min;

  const points = validos.map((val, i) => {
    const x = padding + (i / (validos.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pointsStr = points.join(" ");
  const lastPoint = points[points.length - 1].split(",");

  const sube = validos[validos.length - 1] >= validos[0];
  const strokeColor = color === "auto" ? (sube ? "var(--color-ember)" : "var(--color-slate)") : color;

  return (
    <div className="flex items-center justify-center" title={`Trayectoria histórica (${validos.length} periodos)`}>
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pointsStr}
        />
        <circle
          cx={lastPoint[0]}
          cy={lastPoint[1]}
          r="2"
          fill={strokeColor}
        />
      </svg>
    </div>
  );
}
