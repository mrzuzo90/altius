import { NextResponse } from "next/server";

type RateEntry = { count: number; resetAt: number };
const rateEntries = new Map<string, RateEntry>();

export function validateCik(value: string): string | null {
  const clean = value.trim();
  return /^\d{1,10}$/.test(clean) && Number(clean) > 0 ? clean : null;
}

export function validateTicker(value: string): string | null {
  const clean = value.trim().toUpperCase();
  return /^[A-Z0-9][A-Z0-9.-]{0,14}$/.test(clean) ? clean : null;
}

export function boundedText(value: string | null, maxLength: number): string | null {
  if (value === null) return null;
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, maxLength) : null;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Limitador oportunista por instancia. En producción debe complementarse con el WAF. */
export function rateLimit(
  request: Request,
  bucket: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const now = Date.now();
  const key = `${bucket}:${clientIp(request)}`;
  const current = rateEntries.get(key);
  const entry = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + windowMs }
    : { count: current.count + 1, resetAt: current.resetAt };
  rateEntries.set(key, entry);

  if (rateEntries.size > 5_000) {
    for (const [entryKey, value] of rateEntries) {
      if (value.resetAt <= now) rateEntries.delete(entryKey);
    }
  }

  if (entry.count <= limit) return null;
  const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1_000));
  return NextResponse.json(
    { error: "Demasiadas peticiones. Inténtalo de nuevo más tarde." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export function invalidInput(message = "Parámetros de entrada no válidos."): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function upstreamError(route: string, error: unknown, status = 502): NextResponse {
  const requestId = crypto.randomUUID();
  const detail = error instanceof Error
    ? { name: error.name, message: error.message }
    : { name: "UnknownError", message: String(error) };
  console.error(JSON.stringify({ level: "error", event: "api_failure", route, requestId, ...detail }));
  return NextResponse.json(
    { error: "No se ha podido obtener la información solicitada.", requestId },
    { status },
  );
}
