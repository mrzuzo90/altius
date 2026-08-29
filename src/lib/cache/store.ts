/**
 * Almacén clave-valor con expiración.
 *
 * La caché es siempre oportunista: ninguna implementación debe propagar
 * errores. Si el almacén falla, el consumidor vuelve a la red y la petición
 * sigue adelante. Un fallo de caché nunca es un fallo de producto.
 */
export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}

import { FileSystemCacheStore } from "./fs-store";
import { SupabaseCacheStore } from "./supabase-store";

let singleton: CacheStore | null = null;

/**
 * En Vercel el sistema de ficheros es de solo lectura salvo `/tmp`, y ese
 * `/tmp` es efímero y no se comparte entre invocaciones concurrentes. Allí
 * esta caché es de instancia, no compartida; la caché compartida real la
 * aporta `revalidate` de Next y, en su día, el adaptador de Supabase.
 */
export function getCacheStore(): CacheStore {
  if (singleton) return singleton;
  const dir = process.env.VERCEL ? "/tmp/altius-cache" : ".cache";
  const local = new FileSystemCacheStore(dir);
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  singleton = supabaseUrl && supabaseKey
    ? new LayeredCacheStore(new SupabaseCacheStore(supabaseUrl, supabaseKey), local)
    : local;
  return singleton;
}

/**
 * La capa compartida tiene prioridad y el disco actúa como respaldo oportunista.
 * Ambas implementaciones absorben sus propios errores, por lo que una caída de
 * Supabase termina en un miss local y nunca bloquea la petición del usuario.
 */
export class LayeredCacheStore implements CacheStore {
  constructor(
    private readonly shared: CacheStore,
    private readonly local: CacheStore,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const sharedValue = await this.shared.get<T>(key);
    if (sharedValue !== null) return sharedValue;
    return this.local.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await Promise.all([
      this.shared.set(key, value, ttlSeconds),
      this.local.set(key, value, ttlSeconds),
    ]);
  }
}

/** TTL en segundos por tipo de dato. */
export const TTL = {
  tickerIndex: 60 * 60 * 24,
  submissions: 60 * 60 * 12,
  companyFacts: 60 * 60 * 12,
  prices: 60 * 60 * 6,
  macro: 60 * 60 * 24,
  /** El texto de un informe ya presentado no cambia nunca. */
  filingDocument: 60 * 60 * 24 * 30,
  mdnaSummary: 60 * 60 * 24 * 30,
  news: 60 * 60,
  indices: 60 * 60 * 12,
  commodities: 60 * 60 * 12,
  currencies: 60 * 60 * 12,
  quotes: 60 * 15,
  alertQuotes: 60,
  optionsRealtime: 60 * 15,
  optionsDelayed: 60 * 60 * 24,
  qualityScreener: 60 * 60 * 6,
} as const;
