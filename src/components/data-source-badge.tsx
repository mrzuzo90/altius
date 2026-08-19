import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Distintivo de procedencia. Cada bloque de datos de la aplicación declara de
 * dónde viene y de cuándo es. Es la garantía visible de la regla de veracidad.
 */
export function DataSourceBadge({
  source,
  detail,
  asOf,
  href,
}: {
  source: string;
  detail?: string;
  asOf?: string;
  href?: string;
}) {
  const contenido = (
    <span className="border-border/60 text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium">
      <span className="bg-positive/80 size-1.5 rounded-full" aria-hidden />
      {source}
      {asOf ? <span className="opacity-60">· {asOf}</span> : null}
    </span>
  );

  const envuelto = href ? (
    <a href={href} target="_blank" rel="noreferrer noopener" className="hover:text-foreground transition-colors">
      {contenido}
    </a>
  ) : (
    contenido
  );

  if (!detail) return envuelto;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{envuelto}</TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{detail}</TooltipContent>
    </Tooltip>
  );
}
