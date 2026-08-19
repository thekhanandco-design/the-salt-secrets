import { createClient } from "@supabase/supabase-js";
import { cleanText, distributedRateLimit, readJson, sameOrigin, secureJson, validEmail } from "@/lib/security/http";
import { verifyTurnstile } from "@/lib/security/turnstile";

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return secureJson({ success: false, error: "Invalid request origin." }, { status: 403 });
    const limited = await distributedRateLimit(request, { key: "newsletter", limit: 4, windowMs: 60 * 60_000 });
    if (limited) return limited;
    const payload = await readJson(request, 8_000);
    if (cleanText(payload.website, 100)) return secureJson({ success: true });
    const captcha = await verifyTurnstile(request, payload.turnstileToken, { action: ["newsletter", "newsletter_subscribe"] });
    if (!captcha.success) return secureJson({ success: false, error: captcha.reason }, { status: 400 });
    const email = cleanText(payload.email, 254).toLowerCase();
    if (!validEmail(email)) return secureJson({ success: false, error: "Enter a valid email address." }, { status: 400 });
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return secureJson({ success: false, error: "Newsletter service is not configured." }, { status: 503 });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { error } = await supabase.from("newsletter_subscribers").upsert({ email, status: "subscribed", language: cleanText(payload.language || "en", 10), source: "website-footer", updated_at: new Date().toISOString() }, { onConflict: "email" });
    if (error) return secureJson({ success: false, error: "Subscription could not be saved." }, { status: 500 });
    return secureJson({ success: true });
  } catch {
    return secureJson({ success: false, error: "Invalid request." }, { status: 400 });
  }
}
