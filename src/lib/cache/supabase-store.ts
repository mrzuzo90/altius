import type { CacheStore } from "./store";

/**
 * Adaptador de Postgres, escrito y listo pero inactivo.
 *
 * Se activa en cuanto existan `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`;
 * basta con devolverlo desde `getCacheStore()`. Usa la API REST de Supabase
 * por `fetch`, sin cliente, para no añadir dependencias hasta que haga falta.
 *
 * Esquema en `supabase/migrations/0001_cache_tables.sql`.
 */
export class SupabaseCacheStore implements CacheStore {
  constructor(
    private readonly url: string,
    private readonly serviceKey: string,
    private readonly table = "altius_cache",
  ) {}

  private headers(): HeadersInit {
    return {
      apikey: this.serviceKey,
      Authorization: `Bearer ${this.serviceKey}`,
      "Content-Type": "application/json",
    };
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const res = await fetch(
        `${this.url}/rest/v1/${this.table}?key=eq.${encodeURIComponent(key)}&select=value,expires_at`,
        { headers: this.headers(), cache: "no-store" },
      );
      if (!res.ok) return null;
      const rows = (await res.json()) as { value: T; expires_at: string }[];
      const row = rows[0];
      if (!row) return null;
      if (Date.parse(row.expires_at) < Date.now()) return null;
      return row.value;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
      await fetch(`${this.url}/rest/v1/${this.table}?on_conflict=key`, {
        method: "POST",
        headers: { ...this.headers(), Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify([{ key, value, expires_at: expiresAt }]),
      });
    } catch {
      // Silencioso a propósito.
    }
  }
}
