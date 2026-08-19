import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CacheStore } from "./store";

type Envelope<T> = { expiresAt: number; value: T };

/**
 * Caché en disco. Las claves se hashean, de modo que una clave como
 * `sec/companyfacts:0000320193` produce un único fichero plano en lugar de
 * una jerarquía de directorios.
 */
export class FileSystemCacheStore implements CacheStore {
  constructor(private readonly dir: string) {}

  fileNameFor(key: string): string {
    return `${createHash("sha1").update(key).digest("hex")}.json`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await readFile(join(this.dir, this.fileNameFor(key)), "utf8");
      const env = JSON.parse(raw) as Envelope<T>;
      if (Date.now() > env.expiresAt) return null;
      return env.value;
    } catch {
      // Ausente, corrupto o ilegible: se trata igual que un fallo de caché.
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await mkdir(this.dir, { recursive: true });
      const env: Envelope<T> = { expiresAt: Date.now() + ttlSeconds * 1000, value };
      await writeFile(join(this.dir, this.fileNameFor(key)), JSON.stringify(env), "utf8");
    } catch {
      // Silencioso a propósito: ver la nota en CacheStore.
    }
  }
}
