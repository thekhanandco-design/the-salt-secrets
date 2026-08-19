import { publicApiError } from "@/lib/api-errors";
import { GoogleAuth } from "google-auth-library";
import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type ServiceCredentials = { client_email: string; private_key: string };

function credentialsFromEnvironment(): ServiceCredentials | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<ServiceCredentials>;
      if (parsed.client_email && parsed.private_key) return { client_email: parsed.client_email, private_key: parsed.private_key.replace(/\\n/g, "\n") };
    } catch {}
  }
  const client_email = process.env.GA4_SERVICE_ACCOUNT_EMAIL;
  const private_key = process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  return client_email && private_key ? { client_email, private_key } : null;
}

function isoDate(date: Date) { return date.toISOString().slice(0, 10); }

async function query(siteUrl: string, token: string, body: Record<string, unknown>) {
  const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || `Search Console request failed (${response.status}).`);
  return payload;
}

function mapRows(payload: any, dimensions: string[]) {
  return (payload?.rows || []).map((row: any) => ({
    ...Object.fromEntries(dimensions.map((dimension, index) => [dimension, row.keys?.[index] || ""])),
    clicks: Number(row.clicks || 0),
    impressions: Number(row.impressions || 0),
    ctr: Number(row.ctr || 0),
    position: Number(row.position || 0),
  }));
}

function total(rows: any[]) {
  const clicks = rows.reduce((sum, row) => sum + Number(row.clicks || 0), 0);
  const impressions = rows.reduce((sum, row) => sum + Number(row.impressions || 0), 0);
  const weightedPosition = impressions ? rows.reduce((sum, row) => sum + Number(row.position || 0) * Number(row.impressions || 0), 0) / impressions : 0;
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: weightedPosition };
}

export async function GET(request: Request) {
  try {
    await requireAdminUser(request);
    const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (!siteUrl) return NextResponse.json({ connected: false, reason: "Google Search Console integration is not configured." });
    const credentials = credentialsFromEnvironment();
    const configuredToken = process.env.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN?.trim();
    if (!credentials && !configuredToken) return NextResponse.json({ connected: false, reason: "Google service-account credentials are missing." });

    const url = new URL(request.url);
    const allowed = new Set(["7", "30", "90"]);
    const days = allowed.has(url.searchParams.get("days") || "") ? Number(url.searchParams.get("days")) : 30;
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 2); // Search Console normally has a short reporting delay.
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    const previousEnd = new Date(start);
    previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
    const previousStart = new Date(previousEnd);
    previousStart.setUTCDate(previousStart.getUTCDate() - (days - 1));

    let accessToken = configuredToken || "";
    if (credentials) {
      const auth = new GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
      const client = await auth.getClient();
      const access = await client.getAccessToken();
      if (!access.token) throw new Error("Unable to generate a Search Console access token.");
      accessToken = access.token;
    }

    const common = { startDate: isoDate(start), endDate: isoDate(end), dataState: "all", rowLimit: 1000 };
    const previousCommon = { startDate: isoDate(previousStart), endDate: isoDate(previousEnd), dataState: "all", rowLimit: 1000 };
    const [dailyPayload, queryPayload, pagePayload, countryPayload, devicePayload, previousPayload] = await Promise.all([
      query(siteUrl, accessToken, { ...common, dimensions: ["date"] }),
      query(siteUrl, accessToken, { ...common, dimensions: ["query"], rowLimit: 100 }),
      query(siteUrl, accessToken, { ...common, dimensions: ["page"], rowLimit: 100 }),
      query(siteUrl, accessToken, { ...common, dimensions: ["country"], rowLimit: 100 }),
      query(siteUrl, accessToken, { ...common, dimensions: ["device"], rowLimit: 25 }),
      query(siteUrl, accessToken, { ...previousCommon, dimensions: ["date"] }),
    ]);
    const daily = mapRows(dailyPayload, ["date"]);
    const previousDaily = mapRows(previousPayload, ["date"]);

    return NextResponse.json({
      connected: true,
      siteUrl,
      days,
      generatedAt: new Date().toISOString(),
      range: { startDate: common.startDate, endDate: common.endDate },
      summary: total(daily),
      previous: total(previousDaily),
      daily,
      queries: mapRows(queryPayload, ["query"]),
      pages: mapRows(pagePayload, ["page"]),
      countries: mapRows(countryPayload, ["country"]),
      devices: mapRows(devicePayload, ["device"]),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ connected: false, reason: publicApiError(error, "Unknown Search Console error.") });
  }
}
