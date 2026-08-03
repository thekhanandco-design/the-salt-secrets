import { createClient } from "@supabase/supabase-js";
import { sendCustomerAutoReply, sendLeadEmail, sendWhatsAppWebhook } from "@/lib/notifications";
import { cleanText, rateLimit, readJson, sameOrigin, secureJson, validEmail } from "@/lib/security/http";
import { verifyTurnstile } from "@/lib/security/turnstile";

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return secureJson({ success: false, error: "Invalid request origin." }, { status: 403 });
    const limited = rateLimit(request, { key: "contact", limit: 5, windowMs: 10 * 60_000 });
    if (limited) return limited;
    const payload = await readJson(request);
    if (cleanText(payload.website, 100)) return secureJson({ success: true });
    const captcha = await verifyTurnstile(request, payload.turnstileToken);
    if (!captcha.success) return secureJson({ success: false, error: captcha.reason }, { status: 400 });

    const lead = {
      name: cleanText(payload.name, 120), email: cleanText(payload.email, 254).toLowerCase(), company: cleanText(payload.company, 160),
      whatsapp: cleanText(payload.whatsapp || payload.phone, 60), country: cleanText(payload.country, 80), product: cleanText(payload.product || "General Inquiry", 180),
      quantity: cleanText(payload.quantity, 100), message: cleanText(payload.message, 3000), status: "new",
    };
    if (!lead.name || !validEmail(lead.email) || !lead.whatsapp || !lead.message) return secureJson({ success: false, error: "Please provide valid required details." }, { status: 400 });
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return secureJson({ success: false, error: "Inquiry service is not configured." }, { status: 503 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { error } = await supabase.from("inquiries").insert([lead]);
    if (error) return secureJson({ success: false, error: "Inquiry could not be saved." }, { status: 500 });
    await Promise.allSettled([sendLeadEmail(lead), sendCustomerAutoReply(lead), sendWhatsAppWebhook(lead)]);
    return secureJson({ success: true });
  } catch (error) {
    const status = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? 413 : 400;
    return secureJson({ success: false, error: status === 413 ? "Request is too large." : "Invalid request." }, { status });
  }
}
