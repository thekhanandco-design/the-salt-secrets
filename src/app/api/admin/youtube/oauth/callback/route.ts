import { publicApiError } from "@/lib/api-errors";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { encryptIntegrationToken } from "@/lib/integration-token-crypto";
import { verifyYouTubeOAuthState } from "@/lib/youtube-oauth-state";
import { requireActiveSuperAdminId } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type GoogleTokenPayload = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type YouTubeChannelPayload = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      customUrl?: string;
      thumbnails?: Record<string, { url?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase admin configuration is missing.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function configuredRedirectUri(request: Request) {
  return (
    process.env.YOUTUBE_REDIRECT_URI?.trim() ||
    `${new URL(request.url).origin}/api/admin/youtube/oauth/callback`
  );
}

function integrationRedirect(
  request: Request,
  status: "connected" | "error",
  message?: string,
) {
  const url = new URL("/admin/integrations", request.url);
  url.searchParams.set("youtube", status);

  if (message) {
    url.searchParams.set("message", message.slice(0, 240));
  }

  const response = NextResponse.redirect(url);

  response.cookies.set("youtube_oauth_state", "", {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "lax",
    path: "/api/admin/youtube/oauth/callback",
    maxAge: 0,
  });

  return response;
}

export async function GET(request: NextRequest) {
  try {
    const oauthError = request.nextUrl.searchParams.get("error");

    if (oauthError) {
      return integrationRedirect(
        request,
        "error",
        request.nextUrl.searchParams.get("error_description") || oauthError,
      );
    }

    const code = request.nextUrl.searchParams.get("code");
    const returnedState = request.nextUrl.searchParams.get("state");
    const storedState = request.cookies.get("youtube_oauth_state")?.value;

    if (!code) {
      return integrationRedirect(
        request,
        "error",
        "Google did not return an authorization code.",
      );
    }

    if (!storedState || !returnedState || storedState !== returnedState) {
      return integrationRedirect(request, "error", "YouTube authorization state validation failed. Please reconnect.");
    }
    const statePayload = verifyYouTubeOAuthState(returnedState);
    await requireActiveSuperAdminId(statePayload.adminId);

    const clientId = process.env.YOUTUBE_CLIENT_ID?.trim();
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET?.trim();

    if (!clientId || !clientSecret) {
      throw new Error(
        "YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET is missing.",
      );
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: configuredRedirectUri(request),
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });

    const tokenPayload =
      (await tokenResponse.json().catch(() => ({}))) as GoogleTokenPayload;

    if (!tokenResponse.ok || !tokenPayload.access_token) {
      throw new Error(
        tokenPayload.error_description ||
          tokenPayload.error ||
          `Google token exchange failed (${tokenResponse.status}).`,
      );
    }

    const channelResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true",
      {
        headers: {
          Authorization: `Bearer ${tokenPayload.access_token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const channelPayload =
      (await channelResponse.json().catch(() => ({}))) as YouTubeChannelPayload;

    if (!channelResponse.ok) {
      throw new Error(
        channelPayload.error?.message ||
          `Unable to read the authorized YouTube channel (${channelResponse.status}).`,
      );
    }

    const channel = channelPayload.items?.[0];
    const channelId = channel?.id?.trim();
    const channelTitle = channel?.snippet?.title?.trim();

    if (!channelId) {
      throw new Error(
        "The selected Google account does not have an accessible YouTube channel.",
      );
    }

    const client = serviceClient();
    const now = new Date().toISOString();

    const { data: existingToken, error: existingTokenError } = await client
      .from("integration_oauth_tokens")
      .select("refresh_token_ciphertext")
      .eq("provider", "youtube")
      .maybeSingle();

    if (existingTokenError) {
      throw new Error(existingTokenError.message);
    }

    const encryptedRefreshToken = tokenPayload.refresh_token
      ? encryptIntegrationToken(tokenPayload.refresh_token)
      : existingToken?.refresh_token_ciphertext || null;

    if (!encryptedRefreshToken) {
      throw new Error(
        "Google did not return a refresh token. Revoke the app in your Google account permissions, then connect YouTube again.",
      );
    }

    const expiresAt = tokenPayload.expires_in
      ? new Date(Date.now() + tokenPayload.expires_in * 1000).toISOString()
      : null;

    const thumbnailUrl =
      channel?.snippet?.thumbnails?.high?.url ||
      channel?.snippet?.thumbnails?.default?.url ||
      null;

    const { error: tokenStoreError } = await client
      .from("integration_oauth_tokens")
      .upsert(
        {
          provider: "youtube",
          access_token_ciphertext: encryptIntegrationToken(
            tokenPayload.access_token,
          ),
          refresh_token_ciphertext: encryptedRefreshToken,
          token_type: tokenPayload.token_type || "Bearer",
          scope: tokenPayload.scope || null,
          expires_at: expiresAt,
          account_id: channelId,
          account_name: channelTitle || "YouTube Channel",
          metadata: {
            customUrl: channel?.snippet?.customUrl || null,
            thumbnailUrl,
          },
          updated_at: now,
        },
        {
          onConflict: "provider",
        },
      );

    if (tokenStoreError) {
      throw new Error(tokenStoreError.message);
    }

    const { error: connectionError } = await client
      .from("integration_connections")
      .upsert(
        {
          provider: "youtube",
          label: "YouTube",
          category: "Social Media",
          status: "connected",
          config_hint: {
            channelId,
            channelTitle: channelTitle || "YouTube Channel",
            thumbnailUrl,
          },
          last_checked_at: now,
          updated_at: now,
        },
        {
          onConflict: "provider",
        },
      );

    if (connectionError) {
      throw new Error(connectionError.message);
    }

    return integrationRedirect(request, "connected");
  } catch (error) {
    return integrationRedirect(
      request,
      "error",
      publicApiError(error, "YouTube authorization failed."),
    );
  }
}
