-- Altius — caché compartida en Postgres
--
-- Inactiva hasta que existan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY. El
-- adaptador que la consume vive en src/lib/cache/supabase-store.ts.
--
-- Motivo de existir: en Vercel el sistema de ficheros es de solo lectura salvo
-- /tmp, y ese /tmp es efímero y no se comparte entre invocaciones. La caché de
-- disco allí es de instancia, no compartida. Esta tabla sí lo es, y evita
-- volver a descargar los 3-5 MB de companyfacts de cada empresa.

create table if not exists public.altius_cache (
  key         text primary key,
  value       jsonb       not null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- La limpieza de entradas caducadas se hace por barrido, no en cada lectura.
create index if not exists altius_cache_expires_at_idx
  on public.altius_cache (expires_at);

-- Solo el rol de servicio accede a esta tabla. Nunca debe quedar expuesta al
-- cliente: contiene respuestas completas de la SEC, no datos de usuario, pero
-- una tabla escribible desde el navegador es una invitación a llenarla.
alter table public.altius_cache enable row level security;

comment on table public.altius_cache is
  'Caché clave-valor con expiración para respuestas de la SEC, FRED y el proveedor de precios.';

-- Barrido de caducados. Programable con pg_cron:
--   select cron.schedule('altius-cache-gc', '0 * * * *', $$select public.altius_cache_gc()$$);
create or replace function public.altius_cache_gc()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  borradas integer;
begin
  delete from public.altius_cache where expires_at < now();
  get diagnostics borradas = row_count;
  return borradas;
end;
$$;
