"use client";

export default function ErrorTicker({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-5 py-32 text-center">
      <h1 className="font-display text-graphite text-[40px] leading-[1.2] tracking-[-0.8px]">No se han podido cargar los datos</h1>
      <p className="text-steel mt-5 text-[17px] leading-[1.5] text-pretty">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="bg-graphite font-display mt-8 px-5 py-2.5 text-[16px] leading-none tracking-[-0.02em] text-white transition-opacity hover:opacity-85"
      >
        Reintentar
      </button>
    </div>
  );
}
