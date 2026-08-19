import { publicApiError } from "@/lib/api-errors";
import { GoogleAuth } from "google-auth-library";
import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Row = { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] };

type ServiceCredentials = { client_email: string; private_key: string };

function credentialsFromEnvironment(): ServiceCredentials | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<ServiceCredentials>;
      if (parsed.client_email && parsed.private_key) return { client_email: parsed.client_email, private_key: parsed.private_key.replace(/\\n/g, "\n") };
    } catch {
      // Fall through to the dedicated GA4 variables.
    }
  }
  const client_email = process.env.GA4_SERVICE_ACCOUNT_EMAIL;
  const private_key = process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  return client_email && private_key ? { client_email, private_key } : null;
}

async function gaRequest(path: string, token: string, body: unknown) {
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || `Google Analytics request failed (${response.status}).`);
  return payload;
}

function mapRows(payload: any, dimensionNames: string[], metricNames: string[]) {
  return (payload?.rows || []).map((row: Row) => ({
    ...Object.fromEntries(dimensionNames.map((name, index) => [name, row.dimensionValues?.[index]?.value || ""])),
    ...Object.fromEntries(metricNames.map((name, index) => [name, Number(row.metricValues?.[index]?.value || 0)])),
  }));
}

function summaryFrom(payload: any) {
  const values = payload?.rows?.[0]?.metricValues || [];
  return {
    activeUsers: Number(values[0]?.value || 0),
    totalUsers: Number(values[1]?.value || 0),
    newUsers: Number(values[2]?.value || 0),
    sessions: Number(values[3]?.value || 0),
    pageViews: Number(values[4]?.value || 0),
    bounceRate: Number(values[5]?.value || 0),
    engagementRate: Number(values[6]?.value || 0),
    averageSessionDuration: Number(values[7]?.value || 0),
    keyEvents: Number(values[8]?.value || 0),
    engagedSessions: Number(values[9]?.value || 0),
  };
}

function change(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export async function GET(request: Request) {
  try {
    await requireAdminUser(request);
    const propertyId = process.env.GA4_PROPERTY_ID?.trim();
    if (!propertyId) return NextResponse.json({ connected: false, reason: "Google Analytics integration is not configured." });

    const credentials = credentialsFromEnvironment();
    const configuredToken = process.env.GA4_ACCESS_TOKEN?.trim();
    if (!credentials && !configuredToken) {
      return NextResponse.json({ connected: false, reason: "Google Analytics integration credentials are not configured." });
    }

    const url = new URL(request.url);
    const allowed = new Set(["7", "30", "90"]);
    const days = allowed.has(url.searchParams.get("days") || "") ? Number(url.searchParams.get("days")) : 30;

    let accessToken = configuredToken || "";
    if (credentials) {
      const auth = new GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/analytics.readonly"] });
      const client = await auth.getClient();
      const access = await client.getAccessToken();
      if (!access.token) throw new Error("Unable to generate a Google Analytics access token.");
      accessToken = access.token;
    }

    const currentRange = { dateRanges: [{ startDate: `${days - 1}daysAgo`, endDate: "today" }] };
    const previousRange = { dateRanges: [{ startDate: `${days * 2 - 1}daysAgo`, endDate: `${days}daysAgo` }] };
    const property = `properties/${propertyId}`;
    const report = (body: unknown) => gaRequest(`${property}:runReport`, accessToken, body);
    const realtime = (body: unknown) => gaRequest(`${property}:runRealtimeReport`, accessToken, body);
    const summaryMetrics = [
      { name: "activeUsers" }, { name: "totalUsers" }, { name: "newUsers" }, { name: "sessions" },
      { name: "screenPageViews" }, { name: "bounceRate" }, { name: "engagementRate" },
      { name: "averageSessionDuration" }, { name: "keyEvents" }, { name: "engagedSessions" },
    ];

    const [
      summary, previousSummary, trend, countries, cities, sources, sourceMedium, pages, landingPages,
      devices, browsers, operatingSystems, events, realtimeCountries, realtimePages, realtimeSources,
    ] = await Promise.all([
      report({ ...currentRange, metrics: summaryMetrics }),
      report({ ...previousRange, metrics: summaryMetrics }),
      report({ ...currentRange, dimensions: [{ name: "date" }], metrics: [{ name: "activeUsers" }, { name: "totalUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "keyEvents" }], orderBys: [{ dimension: { dimensionName: "date" } }] }),
      report({ ...currentRange, dimensions: [{ name: "country" }], metrics: [{ name: "activeUsers" }, { name: "totalUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "keyEvents" }], limit: 50, orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }] }),
      report({ ...currentRange, dimensions: [{ name: "city" }, { name: "country" }], metrics: [{ name: "activeUsers" }, { name: "sessions" }], limit: 25, orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }] }),
      report({ ...currentRange, dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "totalUsers" }, { name: "keyEvents" }], limit: 20, orderBys: [{ metric: { metricName: "sessions" }, desc: true }] }),
      report({ ...currentRange, dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }], metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "keyEvents" }], limit: 30, orderBys: [{ metric: { metricName: "sessions" }, desc: true }] }),
      report({ ...currentRange, dimensions: [{ name: "pagePath" }, { name: "pageTitle" }], metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }, { name: "averageSessionDuration" }, { name: "bounceRate" }, { name: "keyEvents" }], limit: 25, orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }] }),
      report({ ...currentRange, dimensions: [{ name: "landingPagePlusQueryString" }], metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "bounceRate" }, { name: "keyEvents" }], limit: 25, orderBys: [{ metric: { metricName: "sessions" }, desc: true }] }),
      report({ ...currentRange, dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "activeUsers" }, { name: "totalUsers" }, { name: "sessions" }, { name: "keyEvents" }] }),
      report({ ...currentRange, dimensions: [{ name: "browser" }], metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "keyEvents" }], limit: 15, orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }] }),
      report({ ...currentRange, dimensions: [{ name: "operatingSystem" }], metrics: [{ name: "activeUsers" }, { name: "sessions" }], limit: 15, orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }] }),
      report({ ...currentRange, dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }, { name: "totalUsers" }, { name: "keyEvents" }], limit: 30, orderBys: [{ metric: { metricName: "eventCount" }, desc: true }] }),
      realtime({ dimensions: [{ name: "country" }], metrics: [{ name: "activeUsers" }], limit: 50 }).catch(() => ({ rows: [] })),
      realtime({ dimensions: [{ name: "unifiedScreenName" }], metrics: [{ name: "activeUsers" }], limit: 25 }).catch(() => ({ rows: [] })),
      realtime({ dimensions: [{ name: "firstUserSource" }, { name: "firstUserMedium" }], metrics: [{ name: "activeUsers" }], limit: 25 }).catch(() => ({ rows: [] })),
    ]);

    const current = summaryFrom(summary);
    const previous = summaryFrom(previousSummary);
    const realtimeCountryRows = mapRows(realtimeCountries, ["country"], ["activeUsers"]);
    const liveNow = realtimeCountryRows.reduce((sum: number, row: any) => sum + Number(row.activeUsers || 0), 0);

    return NextResponse.json({
      connected: true,
      propertyId,
      days,
      generatedAt: new Date().toISOString(),
      summary: current,
      previous,
      comparison: Object.fromEntries(Object.keys(current).map(key => [key, change((current as any)[key], (previous as any)[key])])),
      trend: mapRows(trend, ["date"], ["activeUsers", "totalUsers", "sessions", "pageViews", "keyEvents"]),
      countries: mapRows(countries, ["country"], ["activeUsers", "totalUsers", "sessions", "pageViews", "keyEvents"]),
      cities: mapRows(cities, ["city", "country"], ["activeUsers", "sessions"]),
      sources: mapRows(sources, ["channel"], ["sessions", "activeUsers", "totalUsers", "keyEvents"]),
      sourceMedium: mapRows(sourceMedium, ["source", "medium"], ["sessions", "activeUsers", "keyEvents"]),
      topPages: mapRows(pages, ["pagePath", "pageTitle"], ["pageViews", "activeUsers", "averageSessionDuration", "bounceRate", "keyEvents"]),
      landingPages: mapRows(landingPages, ["landingPage"], ["sessions", "activeUsers", "bounceRate", "keyEvents"]),
      devices: mapRows(devices, ["deviceCategory"], ["activeUsers", "totalUsers", "sessions", "keyEvents"]),
      browsers: mapRows(browsers, ["browser"], ["activeUsers", "sessions", "keyEvents"]),
      operatingSystems: mapRows(operatingSystems, ["operatingSystem"], ["activeUsers", "sessions"]),
      events: mapRows(events, ["eventName"], ["eventCount", "totalUsers", "keyEvents"]),
      realtime: {
        activeUsers: liveNow,
        countries: realtimeCountryRows,
        pages: mapRows(realtimePages, ["pageTitle"], ["activeUsers"]),
        sources: mapRows(realtimeSources, ["source", "medium"], ["activeUsers"]),
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ connected: false, reason: publicApiError(error, "Unknown Analytics error.") });
  }
}
