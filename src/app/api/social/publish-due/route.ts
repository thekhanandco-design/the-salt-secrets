import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  claimSocialPost,
  failClaimedSocialPost,
  publishMetaSocialPost,
  type MetaPostPublishSummary,
  type SocialPostRow,
} from "@/lib/meta-publisher";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service configuration is missing.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is required before automatic social publishing can run." },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = serviceClient();
  const staleBefore = new Date(Date.now() - 15 * 60_000).toISOString();

  await client
    .from("social_scheduled_posts")
    .update({
      status: "scheduled",
      last_error: "Recovered a stale publishing lock; the post will be retried.",
      updated_at: new Date().toISOString(),
    })
    .eq("status", "processing")
    .lt("updated_at", staleBefore);

  const { data, error } = await client
    .from("social_scheduled_posts")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(5);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const summaries: MetaPostPublishSummary[] = [];
  const failures: Array<{ postId: string; error: string }> = [];

  for (const queued of (data || []) as SocialPostRow[]) {
    const claimed = await claimSocialPost(client, queued.id, ["scheduled"]);
    if (!claimed) continue;

    try {
      summaries.push(await publishMetaSocialPost(client, claimed));
    } catch (publishError) {
      await failClaimedSocialPost(client, claimed.id, publishError);
      failures.push({
        postId: claimed.id,
        error: publishError instanceof Error ? publishError.message : "Publishing failed.",
      });
    }
  }

  return NextResponse.json({
    success: failures.length === 0,
    processed: summaries.length + failures.length,
    published: summaries.filter((item) => item.status === "published").length,
    partial: summaries.filter((item) => item.status === "ready_for_adapter").length,
    failed: failures.length + summaries.filter((item) => ["failed", "connection_required"].includes(item.status)).length,
    summaries,
    failures,
  });
}
