import { createClient } from "@supabase/supabase-js";
import { sendLeadEmail, sendWhatsAppWebhook } from "@/lib/notifications";
import { cleanText, distributedRateLimit, readJson, sameOrigin, secureJson, validEmail } from "@/lib/security/http";
import { verifyTurnstile } from "@/lib/security/turnstile";

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return secureJson({ success: false, error: "Invalid request origin." }, { status: 403 });
    const limited = await distributedRateLimit(request, { key: "certificate-request", limit: 4, windowMs: 10 * 60_000 });
    if (limited) return limited;
    const payload = await readJson(request, 24_000);
    if (cleanText(payload.website, 100)) return secureJson({ success: true });
    const captcha = await verifyTurnstile(request, payload.turnstileToken, { action: "certification_request" });
    if (!captcha.success) return secureJson({ success: false, error: captcha.reason }, { status: 400 });

    const requested = Array.isArray(payload.certificates)
      ? payload.certificates.map((item: unknown) => cleanText(item, 120)).filter(Boolean).slice(0, 25)
      : [];
    const lead = {
      name: cleanText(payload.name, 120),
      email: cleanText(payload.email, 254).toLowerCase(),
      company: cleanText(payload.company, 160),
      whatsapp: cleanText(payload.whatsapp || payload.phone, 60),
      country: cleanText(payload.country, 80),
      product: "Certificate / Compliance Documents",
      message: cleanText(payload.message, 2000) || `Requested documents: ${requested.join(", ")}`,
      status: "new",
      form_name: "Certificate Request",
      lead_source: "Website Certificate Request",
      metadata: { designation: cleanText(payload.designation, 120), certificates: requested, request_channel: "website", request_status: "pending" },
    };
    if (!lead.name || !validEmail(lead.email) || !lead.whatsapp || !lead.company || !requested.length) {
      return secureJson({ success: false, error: "Please provide name, company, email, WhatsApp and at least one requested document." }, { status: 400 });
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return secureJson({ success: false, error: "Request service is not configured." }, { status: 503 });
    }
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { error } = await supabase.from("inquiries").insert([lead]);
    if (error) return secureJson({ success: false, error: "Request could not be saved." }, { status: 500 });
    await Promise.allSettled([sendLeadEmail(lead), sendWhatsAppWebhook(lead)]);
    return secureJson({ success: true });
  } catch (reason) {
    const status = reason instanceof Error && reason.message === "PAYLOAD_TOO_LARGE" ? 413 : 400;
    return secureJson({ success: false, error: status === 413 ? "Request is too large." : "Invalid request." }, { status });
  }
}
