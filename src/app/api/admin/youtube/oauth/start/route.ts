import { publicApiError } from "@/lib/api-errors";
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { logAdminSecurityEvent } from "@/lib/security/audit";
import { createYouTubeOAuthState } from "@/lib/youtube-oauth-state";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.upload",
];

function redirectUri(request: Request) {
  return (
    process.env.YOUTUBE_REDIRECT_URI?.trim() ||
    `${new URL(request.url).origin}/api/admin/youtube/oauth/callback`
  );
}

export async function GET(request: Request) {
  try {
    const { client, identity } = await requireSuperAdmin(request);

    const clientId = process.env.YOUTUBE_CLIENT_ID?.trim();

    if (!clientId) {
      console.error("[YouTube OAuth] Required server configuration is missing.");
      return NextResponse.json({ error: "YouTube integration is not fully configured." }, { status: 503 });
    }

    const state = createYouTubeOAuthState(identity.id);
    const authorizationUrl = new URL(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );

    authorizationUrl.searchParams.set("client_id", clientId);
    authorizationUrl.searchParams.set("redirect_uri", redirectUri(request));
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("scope", YOUTUBE_SCOPES.join(" "));
    authorizationUrl.searchParams.set("access_type", "offline");
    authorizationUrl.searchParams.set("include_granted_scopes", "true");
    authorizationUrl.searchParams.set("prompt", "consent");
    authorizationUrl.searchParams.set("state", state);

    await logAdminSecurityEvent(client, identity, "youtube_oauth_started", {});
    const response = NextResponse.json({ authorizationUrl: authorizationUrl.toString() });

    response.cookies.set("youtube_oauth_state", state, {
      httpOnly: true,
      secure: new URL(request.url).protocol === "https:",
      sameSite: "lax",
      path: "/api/admin/youtube/oauth/callback",
      maxAge: 10 * 60,
    });

    return response;
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        error:
          publicApiError(error, "Unable to start YouTube authorization."),
      },
      { status: 500 },
    );
  }
}
