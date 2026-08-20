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
    <span className="border-mist text-steel inline-flex items-center gap-2 rounded-[20px] border px-3 py-1 text-[12px]">
      <span className="bg-ember size-1.5 rounded-full" aria-hidden />
      {source}
      {asOf ? <span className="text-slate">· {asOf}</span> : null}
    </span>
  );

  const envuelto = href ? (
    <a href={href} target="_blank" rel="noreferrer noopener" className="hover:opacity-70 transition-opacity">
      {contenido}
    </a>
  ) : (
    contenido
  );

  if (!detail) return envuelto;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{envuelto}</TooltipTrigger>
      <TooltipContent className="max-w-xs text-[12px]">{detail}</TooltipContent>
    </Tooltip>
  );
}
