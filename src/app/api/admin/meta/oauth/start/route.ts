import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import { createMetaOAuthState } from "@/lib/meta-oauth-state";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function graphVersion() {
  return process.env.META_GRAPH_VERSION?.trim() || "v25.0";
}

function redirectUri(request: Request) {
  return (
    process.env.META_REDIRECT_URI?.trim() ||
    `${new URL(request.url).origin}/api/admin/meta/oauth/callback`
  );
}

export async function GET(request: Request) {
  try {
    const { identity } = await requireAdminUser(request);

    const appId = process.env.META_APP_ID?.trim();
    const configId = process.env.META_LOGIN_CONFIG_ID?.trim();
    const encryptionKey =
      process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY?.trim();

    const missing = [
      !appId ? "META_APP_ID" : null,
      !process.env.META_APP_SECRET?.trim() ? "META_APP_SECRET" : null,
      !configId ? "META_LOGIN_CONFIG_ID" : null,
      !process.env.META_REDIRECT_URI?.trim() ? "META_REDIRECT_URI" : null,
      !encryptionKey ? "INTEGRATION_TOKEN_ENCRYPTION_KEY" : null,
    ].filter(Boolean);

    if (missing.length) {
      return NextResponse.json(
        {
          error: `Missing Meta server configuration: ${missing.join(", ")}.`,
        },
        { status: 400 },
      );
    }

    const authorizationUrl = new URL(
      `https://www.facebook.com/${graphVersion()}/dialog/oauth`,
    );

    authorizationUrl.searchParams.set("client_id", appId!);
    authorizationUrl.searchParams.set("redirect_uri", redirectUri(request));
    authorizationUrl.searchParams.set("config_id", configId!);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set(
      "override_default_response_type",
      "true",
    );
    authorizationUrl.searchParams.set(
      "state",
      createMetaOAuthState(identity.id),
    );

    return NextResponse.json({
      authorizationUrl: authorizationUrl.toString(),
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start Meta authorization.",
      },
      { status: 500 },
    );
  }
}
