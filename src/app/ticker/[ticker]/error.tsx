"use client";

export default function ErrorTicker({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-xl font-semibold">No se han podido cargar los datos</h1>
      <p className="text-muted-foreground mt-2 text-sm text-pretty">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="border-border/60 hover:bg-muted mt-6 rounded-md border px-3 py-1.5 text-sm transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}
