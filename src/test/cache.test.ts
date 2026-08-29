import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FileSystemCacheStore } from "@/lib/cache/fs-store";
import { LayeredCacheStore, type CacheStore } from "@/lib/cache/store";

let dir: string;
let store: FileSystemCacheStore;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "altius-cache-test-"));
  store = new FileSystemCacheStore(dir);
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("FileSystemCacheStore", () => {
  it("devuelve lo que se ha guardado", async () => {
    await store.set("k", { a: 1 }, 60);
    expect(await store.get<{ a: number }>("k")).toEqual({ a: 1 });
  });

  it("devuelve null para una clave inexistente", async () => {
    expect(await store.get("nunca-escrita")).toBeNull();
  });

  it("devuelve null cuando el TTL ha expirado", async () => {
    await store.set("k", "v", -1);
    expect(await store.get("k")).toBeNull();
  });

  it("admite claves con barras y dos puntos sin crear subdirectorios", async () => {
    await store.set("sec/companyfacts:0000320193", [1, 2, 3], 60);
    expect(await store.get("sec/companyfacts:0000320193")).toEqual([1, 2, 3]);
  });

  it("no propaga errores si el directorio no es escribible", async () => {
    const blockedPath = join(dir, "esto-es-un-fichero");
    writeFileSync(blockedPath, "no es un directorio");
    const roto = new FileSystemCacheStore(blockedPath);
    await expect(roto.set("k", "v", 60)).resolves.toBeUndefined();
    await expect(roto.get("k")).resolves.toBeNull();
  });

  it("devuelve null si el fichero contiene JSON corrupto", async () => {
    await store.set("k", "v", 60);
    writeFileSync(join(dir, store.fileNameFor("k")), "{esto no es json");
    expect(await store.get("k")).toBeNull();
  });
});

describe("LayeredCacheStore", () => {
  function memoryStore(initial: Record<string, unknown> = {}): CacheStore {
    const values = new Map(Object.entries(initial));
    return {
      async get<T>(key: string) { return (values.get(key) as T | undefined) ?? null; },
      async set<T>(key: string, value: T) { values.set(key, value); },
    };
  }

  it("prioriza la caché compartida", async () => {
    const store = new LayeredCacheStore(memoryStore({ k: "shared" }), memoryStore({ k: "local" }));
    expect(await store.get("k")).toBe("shared");
  });

  it("usa la caché local cuando la compartida no tiene la clave", async () => {
    const store = new LayeredCacheStore(memoryStore(), memoryStore({ k: "local" }));
    expect(await store.get("k")).toBe("local");
  });
});
