import { clientIp } from "./http";

type TurnstileOptions = {
  action: string | string[];
  hostnames?: string[];
};

function expectedHostnames(request: Request, explicit?: string[]) {
  const values = new Set<string>();
  for (const item of explicit || []) if (item.trim()) values.add(item.trim().toLowerCase());
  for (const item of (process.env.TURNSTILE_EXPECTED_HOSTNAMES || "").split(",")) if (item.trim()) values.add(item.trim().toLowerCase());

  const stableCandidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "",
  ];
  for (const candidate of stableCandidates) {
    if (!candidate) continue;
    try { values.add(new URL(candidate).hostname.toLowerCase()); } catch { /* ignore malformed optional config */ }
  }

  // Preview/dev hosts are useful during testing, but production never trusts the
  // inbound Host header as an allowlist source. Production therefore fails
  // closed when no stable expected hostname is configured.
  if (process.env.NODE_ENV !== "production") {
    for (const candidate of [process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "", request.url]) {
      if (!candidate) continue;
      try { values.add(new URL(candidate).hostname.toLowerCase()); } catch { /* ignore malformed optional config */ }
    }
  }
  return values;
}

export async function verifyTurnstile(request: Request, token: unknown, options: TurnstileOptions) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") return { success: false, reason: "Security verification is not configured." };
    return { success: true, reason: "Development bypass" };
  }
  if (typeof token !== "string" || token.length < 10 || token.length > 4096) {
    return { success: false, reason: "Please complete the security check." };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  body.set("remoteip", clientIp(request));

  let response: Response;
  try {
    response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    return { success: false, reason: "Security verification service is unavailable." };
  }
  if (!response.ok) return { success: false, reason: "Security verification service is unavailable." };

  const result = (await response.json()) as { success?: boolean; hostname?: string; action?: string };
  if (!result.success) return { success: false, reason: "Security verification failed. Please retry." };

  const allowedActions = new Set((Array.isArray(options.action) ? options.action : [options.action]).map((item) => item.trim()).filter(Boolean));
  if (!result.action || !allowedActions.has(result.action)) {
    return { success: false, reason: "Security verification action mismatch." };
  }

  const hostnames = expectedHostnames(request, options.hostnames);
  if (!result.hostname || !hostnames.has(result.hostname.toLowerCase())) {
    return { success: false, reason: "Security verification hostname mismatch." };
  }

  return { success: true } as const;
}
