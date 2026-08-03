import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Definition = { id: string; required: string[]; anyOf?: string[][]; mode?: "external" | "database" };
const definitions: Definition[] = [
  { id: "ga4", required: ["GA4_PROPERTY_ID", "GA4_SERVICE_ACCOUNT_EMAIL", "GA4_SERVICE_ACCOUNT_PRIVATE_KEY"] },
  { id: "gsc", required: ["GA4_SERVICE_ACCOUNT_EMAIL", "GA4_SERVICE_ACCOUNT_PRIVATE_KEY"], anyOf: [["GOOGLE_SEARCH_CONSOLE_SITE_URL", "NEXT_PUBLIC_SITE_URL"]] },
  { id: "gtm", required: ["NEXT_PUBLIC_GTM_ID"] },
  { id: "rich-results", required: [], mode: "external" }, { id: "trends", required: [], mode: "external" },
  { id: "bing", required: ["BING_WEBMASTER_API_KEY"] }, { id: "clarity", required: ["NEXT_PUBLIC_CLARITY_PROJECT_ID"] },
  { id: "drive", required: ["GOOGLE_DRIVE_CLIENT_ID", "GOOGLE_DRIVE_CLIENT_SECRET"] },
  { id: "dropbox", required: ["DROPBOX_ACCESS_TOKEN"] }, { id: "onedrive", required: ["ONEDRIVE_CLIENT_ID", "ONEDRIVE_CLIENT_SECRET"] },
  { id: "openai", required: ["OPENAI_API_KEY"] }, { id: "gemini", required: ["GEMINI_API_KEY"] },
  { id: "claude", required: ["ANTHROPIC_API_KEY"] }, { id: "perplexity", required: ["PERPLEXITY_API_KEY"] },
  { id: "flexibles", required: ["FLEXIBILITY_AI_API_KEY"] },
  { id: "smtp", required: ["RESEND_API_KEY"] }, { id: "outlook", required: ["OUTLOOK_CLIENT_ID", "OUTLOOK_CLIENT_SECRET"] },
  { id: "whatsapp", required: [], anyOf: [["WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_CLOUD_PHONE_NUMBER_ID"], ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_CLOUD_ACCESS_TOKEN"]] },
  { id: "slack", required: ["SLACK_BOT_TOKEN"] }, { id: "teams", required: ["MICROSOFT_TEAMS_WEBHOOK_URL"] },
  { id: "facebook", required: [], anyOf: [["META_ACCESS_TOKEN", "SOCIAL_FACEBOOK_TOKEN"]] }, { id: "instagram", required: [], anyOf: [["META_ACCESS_TOKEN", "SOCIAL_INSTAGRAM_TOKEN"]] },
  { id: "linkedin", required: [], anyOf: [["LINKEDIN_ACCESS_TOKEN", "SOCIAL_LINKEDIN_TOKEN"]] }, { id: "pinterest", required: [], anyOf: [["PINTEREST_ACCESS_TOKEN", "SOCIAL_PINTEREST_TOKEN"]] },
  { id: "threads", required: [], anyOf: [["THREADS_ACCESS_TOKEN", "SOCIAL_THREADS_TOKEN"]] }, { id: "tiktok", required: [], anyOf: [["TIKTOK_ACCESS_TOKEN", "SOCIAL_TIKTOK_TOKEN"]] },
  { id: "youtube", required: [], anyOf: [["YOUTUBE_API_KEY", "SOCIAL_YOUTUBE_TOKEN"]] }, { id: "x", required: [], anyOf: [["X_ACCESS_TOKEN", "SOCIAL_X_TOKEN"]] },
  { id: "cloudflare", required: ["CLOUDFLARE_API_TOKEN"] }, { id: "webhooks", required: ["OUTBOUND_WEBHOOK_URL"] },
  { id: "rest", required: [], mode: "external" }, { id: "sheets", required: ["GOOGLE_SHEETS_ID"] },
  { id: "calendar", required: ["GOOGLE_CALENDAR_ID"] }, { id: "zapier", required: ["ZAPIER_WEBHOOK_URL"] },
  { id: "make", required: ["MAKE_WEBHOOK_URL"] },
];

export async function GET(request: Request) {
  try {
    const { client } = await requireAdminUser(request);
    const { data: stored } = await client.from("integration_connections").select("provider,status,last_checked_at,updated_at");
    const storedMap = new Map((stored || []).map(row => [String(row.provider), row]));
    const items = definitions.map(definition => {
      const missing = definition.required.filter(name => !process.env[name]);
      const missingGroups = (definition.anyOf || []).filter(group => !group.some(name => Boolean(process.env[name])));
      missing.push(...missingGroups.map(group => group.join(" or ")));
      const db = storedMap.get(definition.id);
      const hasRequirements = definition.required.length > 0 || Boolean(definition.anyOf?.length);
      const configured = definition.mode === "external" ? true : hasRequirements && missing.length === 0;
      return {
        id: definition.id,
        configured,
        mode: definition.mode || "api",
        missing,
        storedStatus: db?.status || null,
        lastCheckedAt: db?.last_checked_at || db?.updated_at || null,
      };
    });
    return NextResponse.json({ success: true, generatedAt: new Date().toISOString(), items });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to read integration status." }, { status: 500 });
  }
}
