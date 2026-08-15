import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function platformConfigured(platform: string) {
  const key = String(platform || "").toLowerCase();
  if (key === "facebook") return Boolean(process.env.META_ACCESS_TOKEN || process.env.SOCIAL_FACEBOOK_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_ACCESS_TOKEN);
  if (key === "instagram") return Boolean(process.env.META_ACCESS_TOKEN || process.env.SOCIAL_INSTAGRAM_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN || process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN);
  return Boolean(process.env[`SOCIAL_${key.toUpperCase()}_TOKEN`]);
}

async function run(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase service configuration is missing." }, { status: 500 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date().toISOString();
  const summary = { blogsPublished: 0, socialQueued: 0, socialConnectionRequired: 0, campaignsActivated: 0 };

  const blogs = await supabase.from("blog_posts").select("id,campaign_id,source_topic_id").eq("status", "scheduled").lte("scheduled_at", now).limit(50);
  if (blogs.error) return NextResponse.json({ error: blogs.error.message }, { status: 500 });

  for (const row of blogs.data || []) {
    const update = await supabase.from("blog_posts").update({
      status: "published",
      approval_status: "Published",
      published_at: now,
      updated_at: now,
    }).eq("id", row.id);
    if (!update.error) summary.blogsPublished += 1;
    if (row.source_topic_id) await supabase.from("content_topic_queue").update({ status: "published", updated_at: now }).eq("id", row.source_topic_id);
    if (row.campaign_id) {
      const campaign = await supabase.from("marketing_campaigns").update({ status: "active", sent_at: now, updated_at: now }).eq("id", row.campaign_id);
      if (!campaign.error) summary.campaignsActivated += 1;
    }
  }

  const social = await supabase.from("social_scheduled_posts").select("id,platforms").eq("status", "scheduled").lte("scheduled_at", now).limit(50);
  if (social.error) return NextResponse.json({ error: social.error.message }, { status: 500 });

  for (const row of social.data || []) {
    const platforms = Array.isArray(row.platforms) ? row.platforms.map(String) : [];
    const ready = platforms.length > 0 && platforms.every(platformConfigured);
    const nextStatus = ready ? "ready_for_adapter" : "connection_required";
    const update = await supabase.from("social_scheduled_posts").update({
      status: nextStatus,
      last_error: ready ? null : "Official platform publishing adapter/token is not fully configured.",
      updated_at: now,
    }).eq("id", row.id);
    if (!update.error) {
      if (ready) summary.socialQueued += 1;
      else summary.socialConnectionRequired += 1;
    }
  }

  return NextResponse.json({ success: true, ...summary, note: "Scheduled website blogs were published. Due social records were released to the platform adapter queue; live social publishing requires each official platform adapter/token." });
}

export async function GET(request: Request) { return run(request); }
export async function POST(request: Request) { return run(request); }
