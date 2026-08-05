import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";

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
    await requireAdminUser(request);

    const clientId = process.env.YOUTUBE_CLIENT_ID?.trim();

    if (!clientId) {
      return NextResponse.json(
        {
          error: "YOUTUBE_CLIENT_ID is missing from the server environment.",
        },
        { status: 400 },
      );
    }

    const state = randomBytes(32).toString("base64url");
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

    const response = NextResponse.json({
      authorizationUrl: authorizationUrl.toString(),
    });

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
          error instanceof Error
            ? error.message
            : "Unable to start YouTube authorization.",
      },
      { status: 500 },
    );
  }
}
