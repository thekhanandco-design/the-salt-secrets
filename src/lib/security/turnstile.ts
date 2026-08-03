import { clientIp } from "./http";

export async function verifyTurnstile(request: Request, token: unknown) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") return { success: false, reason: "CAPTCHA is not configured." };
    return { success: true, reason: "Development bypass" };
  }
  if (typeof token !== "string" || token.length < 10) return { success: false, reason: "Please complete the security check." };

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  body.set("remoteip", clientIp(request));

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    cache: "no-store",
  });
  if (!response.ok) return { success: false, reason: "Security verification service is unavailable." };
  const result = (await response.json()) as { success?: boolean; hostname?: string; action?: string };
  return result.success ? { success: true } : { success: false, reason: "Security verification failed. Please retry." };
}
