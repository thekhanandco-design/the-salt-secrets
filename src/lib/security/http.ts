import { NextResponse } from "next/server";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function clientIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function localRateLimit(request: Request, options: { key: string; limit: number; windowMs: number }) {
  const now = Date.now();
  const id = `${options.key}:${clientIp(request)}`;
  const current = buckets.get(id);
  if (!current || current.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + options.windowMs });
    return null;
  }
  if (current.count >= options.limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" } },
    );
  }
  current.count += 1;
  return null;
}

/** In-process fallback. Prefer distributedRateLimit() for internet-facing or expensive routes. */
export function rateLimit(request: Request, options: { key: string; limit: number; windowMs: number }) {
  return localRateLimit(request, options);
}

/**
 * Uses Upstash-compatible Redis REST when configured. A local limiter always
 * runs first; once distributed protection is configured, upstream failures are
 * fail-closed so serverless instances cannot silently bypass the global limit.
 */
export async function distributedRateLimit(
  request: Request,
  options: { key: string; limit: number; windowMs: number },
) {
  const local = localRateLimit(request, options);
  if (local) return local;

  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const key = `tso:rl:${options.key}:${clientIp(request)}`;
  try {
    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["PTTL", key],
      ]),
      cache: "no-store",
    });
    if (!response.ok) {
      return secureJson({ success: false, error: "Request protection is temporarily unavailable." }, { status: 503 });
    }
    const payload = (await response.json()) as Array<{ result?: number | string }>;
    const count = Number(payload?.[0]?.result || 0);
    let ttl = Number(payload?.[1]?.result || -1);
    if (count === 1 || ttl < 0) {
      const expiry = await fetch(`${url}/pexpire/${encodeURIComponent(key)}/${options.windowMs}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!expiry.ok) {
        return secureJson({ success: false, error: "Request protection is temporarily unavailable." }, { status: 503 });
      }
      ttl = options.windowMs;
    }
    if (count > options.limit) {
      return secureJson(
        { success: false, error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((ttl > 0 ? ttl : options.windowMs) / 1000))) } },
      );
    }
  } catch {
    // When a distributed limiter is configured, fail closed rather than silently
    // bypassing cross-instance protection during an upstream outage.
    return secureJson({ success: false, error: "Request protection is temporarily unavailable." }, { status: 503 });
  }
  return null;
}

export async function readJson(request: Request, maxBytes = 32_000) {
  const length = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(length) && length > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");
  try {
    return JSON.parse(text || "{}");
  } catch {
    throw new Error("INVALID_JSON");
  }
}

export function cleanText(value: unknown, max = 500) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, max);
}

export function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value) && value.length <= 254;
}

export function validUuid(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!origin) {
    if (fetchSite === "cross-site") return false;
    return process.env.NODE_ENV !== "production" || fetchSite === "same-origin" || fetchSite === "same-site";
  }
  try {
    const configured = process.env.NEXT_PUBLIC_SITE_URL;
    const expected = new URL(configured || request.url).origin;
    const actual = new URL(origin).origin;
    if (actual === expected) return true;
    if (process.env.NODE_ENV !== "production" && actual === new URL(request.url).origin) return true;
    return false;
  } catch {
    return false;
  }
}

export function secureJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store, max-age=0");
  headers.set("X-Content-Type-Options", "nosniff");
  return NextResponse.json(body, { ...init, headers });
}

export function safeApiError(reason: unknown, fallback = "The request could not be completed.") {
  if (process.env.NODE_ENV !== "production" && reason instanceof Error) return reason.message;
  return fallback;
}
