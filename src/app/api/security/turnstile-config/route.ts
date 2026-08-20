import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function siteKey() {
  return (
    process.env.TURNSTILE_SITE_KEY ||
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ||
    ""
  ).trim();
}

export async function GET() {
  const key = siteKey();

  return NextResponse.json(
    {
      configured: Boolean(key),
      siteKey: key || null,
    },
    {
      status: key ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
