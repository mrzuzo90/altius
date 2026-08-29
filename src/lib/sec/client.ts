import { getCacheStore } from "@/lib/cache/store";
import { fetchWithTimeout } from "@/lib/http";

/**
 * Punto de salida único hacia la SEC.
 *
 * La SEC impone dos condiciones que rompen estos proyectos en producción:
 *
 *   1. Cabecera `User-Agent` identificable con email de contacto. Sin ella
 *      responde 403, y el mensaje que devuelve no siempre lo deja claro.
 *   2. Un máximo de 10 peticiones por segundo por origen.
 *
 * Ningún otro módulo debe llamar a `fetch` contra sec.gov directamente.
 * Referencia: https://www.sec.gov/os/webmaster-faq#developers
 */

const MAX_REQUESTS_PER_SECOND = 10;
const WINDOW_MS = 1000;

let recentRequests: number[] = [];
let chain: Promise<unknown> = Promise.resolve();
let warnedAboutUserAgent = false;

function userAgent(): string {
  const configured = process.env.SEC_USER_AGENT?.trim();
  if (configured) return configured;
  if (!warnedAboutUserAgent) {
    warnedAboutUserAgent = true;
    console.warn(
      "[altius] SEC_USER_AGENT no está configurado. La SEC exige un User-Agent " +
        "con contacto real y responderá 403 sin él. Copia .env.example a .env.local.",
    );
  }
  return "Altius/1.0 (configura SEC_USER_AGENT; contacto@example.com)";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Espera hasta que quede hueco en la ventana deslizante de 1 segundo. */
async function acquireSlot(): Promise<void> {
  for (;;) {
    const now = Date.now();
    recentRequests = recentRequests.filter((t) => now - t < WINDOW_MS);
    if (recentRequests.length < MAX_REQUESTS_PER_SECOND) {
      recentRequests.push(now);
      return;
    }
    await sleep(WINDOW_MS - (now - recentRequests[0]) + 5);
  }
}

/** Serializa la adquisición de hueco para que las llamadas concurrentes no se pisen. */
function throttle<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(acquireSlot).then(fn);
  // La cadena solo ordena; un fallo no debe envenenar las llamadas siguientes.
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export class SecRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
  ) {
    super(message);
    this.name = "SecRequestError";
  }
}

async function rawFetch(url: string, attempt = 0): Promise<Response> {
  const res = await throttle(() =>
    fetchWithTimeout(url, {
      headers: {
        "User-Agent": userAgent(),
        "Accept-Encoding": "gzip, deflate",
        Accept: "application/json, text/html, */*",
      },
      cache: "no-store",
    }),
  );

  if (res.status === 403) {
    throw new SecRequestError(
      "La SEC ha rechazado la petición con 403. La causa casi siempre es la " +
        "cabecera User-Agent: define SEC_USER_AGENT con tu nombre y un email real.",
      403,
      url,
    );
  }

  if ((res.status === 429 || res.status >= 500) && attempt < 3) {
    await sleep(2 ** attempt * 500);
    return rawFetch(url, attempt + 1);
  }

  if (!res.ok) {
    throw new SecRequestError(`La SEC ha devuelto ${res.status} para ${url}`, res.status, url);
  }
  return res;
}

async function fetchCached<T>(
  url: string,
  ttlSeconds: number,
  parse: (res: Response) => Promise<T>,
): Promise<T> {
  const cache = getCacheStore();
  const cached = await cache.get<T>(url);
  if (cached !== null) return cached;
  const value = await parse(await rawFetch(url));
  await cache.set(url, value, ttlSeconds);
  return value;
}

export function secFetchJson<T>(url: string, ttlSeconds: number): Promise<T> {
  return fetchCached<T>(url, ttlSeconds, (res) => res.json() as Promise<T>);
}

export function secFetchText(url: string, ttlSeconds: number): Promise<string> {
  return fetchCached<string>(url, ttlSeconds, (res) => res.text());
}

/**
 * `320193` → `"0000320193"`. Requerido por data.sec.gov/api y /submissions.
 *
 * Se eliminan primero los ceros a la izquierda para que la función sea
 * idempotente: sin eso, un CIK ya relleno que llegue por la URL de una API se
 * volvería a rellenar y produciría una ruta de más de diez dígitos y un 404.
 */
export function padCik(cik: string | number): string {
  const digitos = String(cik).replace(/\D/g, "").replace(/^0+/, "");
  return digitos.padStart(10, "0");
}

/** `"0000320193"` → `"320193"`. Requerido por las rutas de www.sec.gov/Archives. */
export function trimCik(cik: string | number): string {
  return String(Number(String(cik).replace(/\D/g, "")));
}
