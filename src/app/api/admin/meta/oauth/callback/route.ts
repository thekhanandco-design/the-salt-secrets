import { publicApiError } from "@/lib/api-errors";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { encryptIntegrationToken } from "@/lib/integration-token-crypto";
import { verifyMetaOAuthState } from "@/lib/meta-oauth-state";
import { requireActiveSuperAdminId } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const META_SCOPES = [
  "business_management",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
];

type MetaTokenPayload = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  data?: {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
  };
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
};

type InstagramAccount = {
  id?: string;
  username?: string;
  name?: string;
  profile_picture_url?: string;
};

type FacebookPage = {
  id?: string;
  name?: string;
  business?: {
    id?: string;
    name?: string;
  };
  instagram_business_account?: InstagramAccount;
};

type MetaIdentityPayload = {
  id?: string;
  name?: string;
  accounts?: {
    data?: FacebookPage[];
  };
  error?: {
    message?: string;
    type?: string;
    code?: number;
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

function graphVersion() {
  return process.env.META_GRAPH_VERSION?.trim() || "v25.0";
}

function configuredRedirectUri(request: Request) {
  return (
    process.env.META_REDIRECT_URI?.trim() ||
    `${new URL(request.url).origin}/api/admin/meta/oauth/callback`
  );
}

function integrationRedirect(
  request: Request,
  status: "connected" | "error",
  message?: string,
) {
  const url = new URL("/admin/integrations", request.url);
  url.searchParams.set("meta", status);

  if (message) {
    url.searchParams.set("message", message.slice(0, 280));
  }

  return NextResponse.redirect(url);
}

function choosePage(pages: FacebookPage[]) {
  const validPages = pages.filter((page) => page.id?.trim());

  if (!validPages.length) {
    throw new Error(
      "Meta did not return an authorized Facebook Page. Reconnect and select The Salt Origin Page in the Meta business asset picker.",
    );
  }

  if (validPages.length === 1) {
    return validPages[0];
  }

  const pagesWithInstagram = validPages.filter(
    (page) => page.instagram_business_account?.id?.trim(),
  );

  if (pagesWithInstagram.length === 1) {
    return pagesWithInstagram[0];
  }

  throw new Error(
    "Multiple Facebook Pages were authorized. Reconnect Meta and select only the Page you want this CMS to publish to.",
  );
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
    const state = verifyMetaOAuthState(
      request.nextUrl.searchParams.get("state"),
    );
    await requireActiveSuperAdminId(state.adminId);

    if (!code) {
      return integrationRedirect(
        request,
        "error",
        "Meta did not return an authorization code.",
      );
    }

    const appId = process.env.META_APP_ID?.trim();
    const appSecret = process.env.META_APP_SECRET?.trim();

    if (!appId || !appSecret) {
      throw new Error("META_APP_ID or META_APP_SECRET is missing.");
    }

    const tokenResponse = await fetch(
      `https://graph.facebook.com/${graphVersion()}/oauth/access_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          code,
          redirect_uri: configuredRedirectUri(request),
        }),
        cache: "no-store",
      },
    );

    const tokenPayload =
      (await tokenResponse.json().catch(() => ({}))) as MetaTokenPayload;
    const accessToken =
      tokenPayload.access_token || tokenPayload.data?.access_token;
    const tokenType =
      tokenPayload.token_type || tokenPayload.data?.token_type || "Bearer";
    const expiresIn =
      tokenPayload.expires_in || tokenPayload.data?.expires_in;

    if (!tokenResponse.ok || !accessToken) {
      throw new Error(
        tokenPayload.error?.message ||
          `Meta token exchange failed (${tokenResponse.status}).`,
      );
    }

    const fields = [
      "id",
      "name",
      "accounts.limit(100){id,name,business,instagram_business_account{id,username,name,profile_picture_url}}",
    ].join(",");
    const identityUrl = new URL(
      `https://graph.facebook.com/${graphVersion()}/me`,
    );
    identityUrl.searchParams.set("fields", fields);

    const identityResponse = await fetch(identityUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const identityPayload =
      (await identityResponse.json().catch(() => ({}))) as MetaIdentityPayload;

    if (!identityResponse.ok) {
      throw new Error(
        identityPayload.error?.message ||
          `Unable to read authorized Meta assets (${identityResponse.status}).`,
      );
    }

    const pages = identityPayload.accounts?.data || [];
    const page = choosePage(pages);
    const pageId = page.id!.trim();
    const pageName = page.name?.trim() || "Facebook Page";
    const instagram = page.instagram_business_account;
    const instagramId = instagram?.id?.trim() || null;
    const instagramUsername = instagram?.username?.trim() || null;
    const now = new Date().toISOString();
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;
    const client = serviceClient();

    const authorizedPages = pages
      .filter((item) => item.id?.trim())
      .map((item) => ({
        id: item.id || null,
        name: item.name || null,
        businessId: item.business?.id || null,
        businessName: item.business?.name || null,
        instagramAccountId: item.instagram_business_account?.id || null,
        instagramUsername:
          item.instagram_business_account?.username || null,
      }));

    const { error: tokenStoreError } = await client
      .from("integration_oauth_tokens")
      .upsert(
        {
          provider: "meta",
          access_token_ciphertext: encryptIntegrationToken(accessToken),
          refresh_token_ciphertext: null,
          token_type: tokenType,
          scope: META_SCOPES.join(" "),
          expires_at: expiresAt,
          account_id: pageId,
          account_name: pageName,
          metadata: {
            tokenKind: "system_user",
            graphVersion: graphVersion(),
            connectedByAdminId: state.adminId,
            metaIdentityId: identityPayload.id || null,
            metaIdentityName: identityPayload.name || null,
            facebookPageId: pageId,
            facebookPageName: pageName,
            businessId: page.business?.id || null,
            businessName: page.business?.name || null,
            instagramAccountId: instagramId,
            instagramUsername,
            instagramName: instagram?.name || null,
            instagramProfilePictureUrl:
              instagram?.profile_picture_url || null,
            authorizedPages,
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
          provider: "meta",
          label: "Meta / Facebook / Instagram",
          category: "Social Media",
          status: "connected",
          config_hint: {
            facebookPageId: pageId,
            facebookPageName: pageName,
            businessId: page.business?.id || null,
            businessName: page.business?.name || null,
            instagramAccountId: instagramId,
            instagramUsername,
            instagramName: instagram?.name || null,
            authorizedPageCount: authorizedPages.length,
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

    const message = instagramId
      ? `Facebook Page ${pageName} and Instagram ${instagramUsername ? `@${instagramUsername}` : "account"} connected successfully.`
      : `Facebook Page ${pageName} connected. No linked Instagram Professional account was returned by Meta.`;

    return integrationRedirect(request, "connected", message);
  } catch (error) {
    return integrationRedirect(
      request,
      "error",
      publicApiError(error, "Meta authorization failed."),
    );
  }
}
