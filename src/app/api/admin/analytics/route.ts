import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const accessToken = process.env.GA4_ACCESS_TOKEN;
  if (!propertyId || !accessToken) {
    return NextResponse.json({ connected: false, reason: "Add GA4_PROPERTY_ID and GA4_ACCESS_TOKEN to enable live analytics." });
  }
  try {
    const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ dateRanges: [{ startDate: "30daysAgo", endDate: "today" }], metrics: [{ name: "activeUsers" }, { name: "engagementRate" }, { name: "averageSessionDuration" }] }),
      cache: "no-store",
    });
    const payload = await response.json();
    if (!response.ok) return NextResponse.json({ connected: false, reason: payload?.error?.message || "GA4 request failed." });
    const values = payload.rows?.[0]?.metricValues || [];
    return NextResponse.json({ connected: true, activeUsers: Number(values[0]?.value || 0), engagementRate: Number(values[1]?.value || 0), averageSessionDuration: Number(values[2]?.value || 0) });
  } catch (error) {
    return NextResponse.json({ connected: false, reason: error instanceof Error ? error.message : "GA4 connection failed." });
  }
}
