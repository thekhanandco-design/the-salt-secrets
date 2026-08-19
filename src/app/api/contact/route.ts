import { createClient } from "@supabase/supabase-js";
import { sendCustomerAutoReply, sendLeadEmail, sendWhatsAppWebhook } from "@/lib/notifications";
import { cleanText, distributedRateLimit, readJson, sameOrigin, secureJson, validEmail } from "@/lib/security/http";
import { verifyTurnstile } from "@/lib/security/turnstile";

const PRODUCT_CATEGORIES = new Set(["Edible Salt", "Salt Lamps", "Salt Tiles / Bricks", "Cooking Plates / Slabs", "Animal Lick Salt", "Bulk & Raw Salt"]);
const QUANTITY_OPTIONS = new Set(["Sample / Trial Order", "Under 500 kg", "500 kg – 1 MT", "1 – 5 MT", "5 – 10 MT", "10 – 25 MT", "25 – 50 MT", "50+ MT", "Full Container Load", "Not Sure Yet"]);
const ANNUAL_VOLUME_OPTIONS = new Set(["Starter – Under 10,000 units", "10,000 – 50,000 units", "50,000 – 100,000 units", "100,000 – 250,000 units", "250,000 – 500,000 units", "500,000+ units", "Not Sure Yet"]);
const PRIVATE_LABEL_OPTIONS = new Set(["Yes", "No", "Not Sure Yet"]);
const INCOTERM_OPTIONS = new Set(["", "EXW", "FOB", "CFR", "CIF", "DDP", "Not Sure / Please Advise"]);

type DbError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
} | null;

function isLocalRequest(request: Request) {
  try {
    const host = new URL(request.url).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

function compactDbError(error: DbError) {
  if (!error) return "unknown";
  return [error.code, error.message, error.details, error.hint].filter(Boolean).join(" | ").slice(0, 700);
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return secureJson({ success: false, error: "Invalid request origin." }, { status: 403 });
    const limited = await distributedRateLimit(request, { key: "contact", limit: 5, windowMs: 10 * 60_000 });
    if (limited) return limited;

    const payload = await readJson(request);
    if (cleanText(payload.website, 100)) return secureJson({ success: true });

    const captcha = await verifyTurnstile(request, payload.turnstileToken, { action: "contact_form" });
    if (!captcha.success) return secureJson({ success: false, error: captcha.reason }, { status: 400 });

    const name = cleanText(payload.name, 120);
    const email = cleanText(payload.email, 254).toLowerCase();
    const company = cleanText(payload.company, 160);
    const phone = cleanText(payload.phone, 60);
    const rawCategories: unknown[] = Array.isArray(payload.productCategories)
      ? payload.productCategories
      : payload.productCategory
        ? [payload.productCategory]
        : [];
    const productCategories: string[] = [...new Set<string>(rawCategories.map((value: unknown) => cleanText(value, 100)).filter((value): value is string => Boolean(value)))];
    const estimatedQuantity = cleanText(payload.estimatedQuantity, 100);
    const estimatedAnnualVolume = cleanText(payload.estimatedAnnualVolume, 120);
    const privateLabelRequired = cleanText(payload.privateLabelRequired, 40);
    const targetMarket = cleanText(payload.targetMarket, 100);
    const incotermPreference = cleanText(payload.incotermPreference, 60);
    const message = cleanText(payload.message, 3000);

    const validCategories = productCategories.length > 0
      && productCategories.length <= PRODUCT_CATEGORIES.size
      && productCategories.every((category) => PRODUCT_CATEGORIES.has(category));

    if (!name || !validEmail(email) || !validCategories || !QUANTITY_OPTIONS.has(estimatedQuantity) || !ANNUAL_VOLUME_OPTIONS.has(estimatedAnnualVolume) || !PRIVATE_LABEL_OPTIONS.has(privateLabelRequired) || !INCOTERM_OPTIONS.has(incotermPreference) || !message) {
      return secureJson({ success: false, error: "Please provide valid required details." }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return secureJson({ success: false, error: "Inquiry service is not configured." }, { status: 503 });
    }

    const productCategory = productCategories.join(", ");
    const structuredMessage = [
      message,
      "",
      "--- Quote Request Details ---",
      `Product Categories: ${productCategory}`,
      `Estimated Quantity: ${estimatedQuantity}`,
      `Estimated Annual Volume: ${estimatedAnnualVolume}`,
      `Private Label Required: ${privateLabelRequired}`,
      targetMarket ? `Target Market: ${targetMarket}` : "",
      incotermPreference ? `Incoterm Preference: ${incotermPreference}` : "",
    ].filter(Boolean).join("\n");

    const lead = {
      name,
      email,
      company,
      whatsapp: phone,
      country: targetMarket,
      product: productCategory,
      quantity: estimatedQuantity,
      estimatedAnnualVolume,
      privateLabelRequired,
      targetMarket,
      incotermPreference,
      message,
      status: "new",
    };

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Attempt 1: full current enterprise schema.
    // If production is behind on migrations, the next attempts deliberately use older known-working shapes.
    const attempts: Array<Record<string, unknown>> = [
      {
        name,
        email,
        company,
        phone,
        whatsapp: phone,
        country: targetMarket,
        product: productCategory,
        quantity: estimatedQuantity,
        estimated_volume: estimatedAnnualVolume,
        packaging_requirement: privateLabelRequired,
        message: structuredMessage,
        status: "new",
        form_name: "Request Quote",
        source_page: "/contact",
        lead_source: "Website Quote Request",
        metadata: {
          product_categories: productCategories,
          estimated_annual_volume: estimatedAnnualVolume,
          private_label_required: privateLabelRequired,
          target_market: targetMarket,
          incoterm_preference: incotermPreference,
        },
      },
      // Known legacy website shape used by the original working inquiry endpoint.
      {
        name,
        email,
        company,
        whatsapp: phone,
        country: targetMarket,
        product: productCategory,
        quantity: estimatedQuantity,
        message: structuredMessage,
        status: "new",
      },
      // Original base-schema shape used by the earliest CMS schema.
      {
        name,
        email,
        phone,
        company,
        country: targetMarket,
        product: productCategory,
        message: structuredMessage,
        status: "new",
      },
      // Last-resort compatibility shape. Required buyer details remain embedded in message.
      {
        name,
        email,
        message: structuredMessage,
      },
    ];

    let saved = false;
    let lastError: DbError = null;
    let successfulAttempt = 0;

    for (let index = 0; index < attempts.length; index += 1) {
      const result = await supabase.from("inquiries").insert([attempts[index]]);
      if (!result.error) {
        saved = true;
        successfulAttempt = index + 1;
        break;
      }
      lastError = result.error;
      console.error(`[contact] inquiry insert attempt ${index + 1} failed:`, compactDbError(result.error));
    }

    if (!saved) {
      const localDebug = isLocalRequest(request) ? ` Database: ${compactDbError(lastError)}` : "";
      return secureJson({ success: false, error: `Quote request could not be saved.${localDebug}` }, { status: 500 });
    }

    console.info(`[contact] inquiry saved using compatibility attempt ${successfulAttempt}`);
    await Promise.allSettled([sendLeadEmail(lead), sendCustomerAutoReply(lead), sendWhatsAppWebhook(lead)]);
    return secureJson({ success: true });
  } catch (error) {
    console.error("[contact] unexpected error:", error);
    const status = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? 413 : 400;
    return secureJson({ success: false, error: status === 413 ? "Request is too large." : "Invalid request." }, { status });
  }
}
