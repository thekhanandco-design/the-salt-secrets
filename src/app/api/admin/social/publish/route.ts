import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import {
  claimSocialPost,
  failClaimedSocialPost,
  publishMetaSocialPost,
  type SocialPostRow,
} from "@/lib/meta-publisher";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function normal(value: unknown) {
  return String(value || "").trim().toLowerCase().replaceAll("_", " ");
}

export async function POST(request: Request) {
  try {
    const { client } = await requireAdminUser(request);
    const body = await request.json().catch(() => ({}));
    const postId = String(body.postId || "").trim();

    if (!postId) return NextResponse.json({ error: "postId is required." }, { status: 400 });

    const { data, error } = await client
      .from("social_scheduled_posts")
      .select("*")
      .eq("id", postId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return NextResponse.json({ error: "Social post was not found." }, { status: 404 });

    const row = data as SocialPostRow;
    const approval = normal(row.approval_status);
    const mayPublish = ["approved", "scheduled", "failed", "published"].includes(approval) || Boolean(row.approved_at);

    if (!mayPublish) {
      return NextResponse.json(
        { error: "Approve this post before publishing. Draft and review content cannot be published." },
        { status: 409 },
      );
    }

    if (normal(row.status) === "published") {
      return NextResponse.json({
        success: true,
        skipped: true,
        summary: {
          postId,
          status: "published",
          message: "This post is already published.",
          results: row.platform_results || {},
        },
      });
    }

    const claimed = await claimSocialPost(client, postId, [
      "approved",
      "scheduled",
      "failed",
      "connection_required",
      "ready_for_adapter",
    ]);

    if (!claimed) {
      return NextResponse.json(
        { error: "This post is already being processed or its status changed. Refresh Social Studio and try again." },
        { status: 409 },
      );
    }

    try {
      const summary = await publishMetaSocialPost(client, claimed);
      return NextResponse.json({ success: summary.failedPlatforms.length === 0, summary });
    } catch (error) {
      await failClaimedSocialPost(client, postId, error);
      throw error;
    }
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Social publishing failed." },
      { status: 500 },
    );
  }
}
