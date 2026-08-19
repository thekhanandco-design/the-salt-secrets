import { publicApiError } from "@/lib/api-errors";
import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type BingSite = {
  Url?: string;
  IsVerified?: boolean;
};

function normalizeSiteUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    return `${hostname}${pathname}`;
  } catch {
    return value
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/+$/, "")
      .toLowerCase();
  }
}

function bingErrorMessage(payload: unknown, status: number) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }

    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }

    const nestedError = record.error;

    if (nestedError && typeof nestedError === "object") {
      const errorRecord = nestedError as Record<string, unknown>;

      if (
        typeof errorRecord.message === "string" &&
        errorRecord.message.trim()
      ) {
        return errorRecord.message;
      }
    }
  }

  return `Bing Webmaster request failed (${status}).`;
}

export async function GET(request: Request) {
  try {
    await requireAdminUser(request);

    const apiKey = process.env.BING_WEBMASTER_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json({
        connected: false,
        reason: "Bing Webmaster integration is not configured.",
      });
    }

    const configuredSiteUrl =
      process.env.BING_WEBMASTER_SITE_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      "https://www.thesaltorigin.com/";

    const endpoint =
      "https://ssl.bing.com/webmaster/api.svc/json/GetUserSites" +
      `?apikey=${encodeURIComponent(apiKey)}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        bingErrorMessage(payload, response.status),
      );
    }

    const rawSites =
      payload &&
      typeof payload === "object" &&
      Array.isArray((payload as { d?: unknown }).d)
        ? ((payload as { d: BingSite[] }).d || [])
        : [];

    const sites = rawSites
      .filter(
        (site): site is BingSite & { Url: string } =>
          typeof site?.Url === "string" &&
          Boolean(site.Url.trim()),
      )
      .map((site) => ({
        url: site.Url.trim(),
        isVerified: Boolean(site.IsVerified),
      }));

    if (!sites.length) {
      return NextResponse.json({
        connected: false,
        reason:
          "The Bing API key is valid, but no sites were returned for this Bing Webmaster account.",
        sites: [],
      });
    }

    const target = normalizeSiteUrl(configuredSiteUrl);
    const matchedSite =
      sites.find(
        (site) => normalizeSiteUrl(site.url) === target,
      ) || null;

    if (!matchedSite) {
      return NextResponse.json({
        connected: false,
        reason: `Bing API connected, but ${configuredSiteUrl} was not found in this account.`,
        configuredSiteUrl,
        sites,
      });
    }

    if (!matchedSite.isVerified) {
      return NextResponse.json({
        connected: false,
        reason: `${matchedSite.url} exists in Bing Webmaster Tools but is not verified.`,
        configuredSiteUrl,
        site: matchedSite,
        sites,
      });
    }

    return NextResponse.json({
      connected: true,
      configuredSiteUrl,
      checkedAt: new Date().toISOString(),
      site: matchedSite,
      sites,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        connected: false,
        reason:
          publicApiError(error, "Unknown Bing Webmaster error."),
      },
      { status: 500 },
    );
  }
}