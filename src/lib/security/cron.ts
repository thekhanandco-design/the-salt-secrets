import { timingSafeEqual } from "node:crypto";
import { distributedRateLimit, secureJson } from "./http";

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function requireCron(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization") || "";
  if (!secret || !authorization.startsWith("Bearer ")) {
    return secureJson({ error: "Unauthorized." }, { status: 401 });
  }
  const supplied = authorization.slice(7).trim();
  if (!supplied || !safeEqual(supplied, secret)) {
    return secureJson({ error: "Unauthorized." }, { status: 401 });
  }
  const pathname = (() => { try { return new URL(request.url).pathname; } catch { return "unknown"; } })();
  return distributedRateLimit(request, { key: `cron:${pathname}`, limit: 30, windowMs: 60 * 60_000 });
}
