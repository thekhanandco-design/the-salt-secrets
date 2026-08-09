import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptIntegrationToken } from "@/lib/integration-token-crypto";

const META_PLATFORMS = new Set(["facebook", "instagram"]);
const META_PROVIDER = "meta";

type JsonRecord = Record<string, unknown>;

type MetaErrorPayload = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    is_transient?: boolean;
    fbtrace_id?: string;
  };
};

type MetaPage = {
  id?: string;
  name?: string;
  access_token?: string;
  instagram_business_account?: {
    id?: string;
    username?: string;
  };
};

type MetaAccountsPayload = MetaErrorPayload & {
  data?: MetaPage[];
};

type MetaTokenRow = {
  access_token_ciphertext: string;
  expires_at?: string | null;
  account_id?: string | null;
  account_name?: string | null;
  metadata?: JsonRecord | null;
};

export type SocialPostRow = {
  id: string;
  title?: string | null;
  caption?: string | null;
  hashtags?: string | null;
  image_url?: string | null;
  platforms?: string[] | null;
  platform_content?: JsonRecord | null;
  platform_images?: JsonRecord | null;
  platform_results?: JsonRecord | null;
  approval_status?: string | null;
  approved_at?: string | null;
  scheduled_at?: string | null;
  status?: string | null;
  brief?: JsonRecord | null;
  updated_at?: string | null;
};

type MetaPublishingContext = {
  graphVersion: string;
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  instagramAccountId: string | null;
  instagramUsername: string | null;
};

export type PlatformPublishResult = {
  status: "published" | "failed" | "connection_required" | "not_supported";
  externalPostId?: string;
  permalink?: string | null;
  publishedAt?: string;
  attemptedAt: string;
  error?: string;
  errorCode?: number;
  errorSubcode?: number;
  traceId?: string;
};

export type MetaPostPublishSummary = {
  postId: string;
  status: string;
  publishedPlatforms: string[];
  failedPlatforms: string[];
  remainingPlatforms: string[];
  results: Record<string, PlatformPublishResult | JsonRecord>;
  message: string;
};

class MetaApiError extends Error {
  code?: number;
  subcode?: number;
  traceId?: string;
  transient?: boolean;

  constructor(message: string, payload?: MetaErrorPayload["error"]) {
    super(message);
    this.name = "MetaApiError";
    this.code = payload?.code;
    this.subcode = payload?.error_subcode;
    this.traceId = payload?.fbtrace_id;
    this.transient = payload?.is_transient;
  }
}

class MetaConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MetaConnectionError";
  }
}

function graphVersion() {
  return process.env.META_GRAPH_VERSION?.trim() || "v25.0";
}

function cleanError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error || "Meta publishing failed.");
  return raw
    .replace(/access_token=[^&\s]+/gi, "access_token=[REDACTED]")
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, "Bearer [REDACTED]")
    .slice(0, 500);
}

function metaErrorDetails(error: unknown) {
  if (!(error instanceof MetaApiError)) return {};
  return {
    errorCode: error.code,
    errorSubcode: error.subcode,
    traceId: error.traceId,
  };
}

function isAuthError(error: unknown) {
  return error instanceof MetaApiError && (error.code === 190 || error.code === 102);
}

async function markMetaReconnectRequired(client: SupabaseClient, message: string) {
  await client
    .from("integration_connections")
    .update({
      status: "reauthorization_required",
      last_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("provider", META_PROVIDER);

  console.warn("Meta connection requires reauthorization:", cleanError(message));
}

async function graphRequest<T>(
  path: string,
  accessToken: string,
  options: {
    method?: "GET" | "POST";
    params?: Record<string, string | undefined>;
  } = {},
): Promise<T> {
  const method = options.method || "GET";
  const url = new URL(
    path.startsWith("http")
      ? path
      : `https://graph.facebook.com/${graphVersion()}/${path.replace(/^\//, "")}`,
  );
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(options.params || {})) {
    if (value !== undefined && value !== "") params.set(key, value);
  }

  if (method === "GET") {
    for (const [key, value] of params.entries()) url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(method === "POST"
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : {}),
    },
    body: method === "POST" ? params.toString() : undefined,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as T & MetaErrorPayload;

  if (!response.ok || payload.error) {
    throw new MetaApiError(
      payload.error?.message || `Meta Graph API request failed (${response.status}).`,
      payload.error,
    );
  }

  return payload as T;
}

function metadataString(metadata: JsonRecord, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function loadMetaPublishingContext(client: SupabaseClient): Promise<MetaPublishingContext> {
  const { data, error } = await client
    .from("integration_oauth_tokens")
    .select("access_token_ciphertext,expires_at,account_id,account_name,metadata")
    .eq("provider", META_PROVIDER)
    .maybeSingle();

  if (error) throw new MetaConnectionError(error.message);
  if (!data?.access_token_ciphertext) {
    throw new MetaConnectionError("Meta is not connected. Open Integrations and connect Facebook / Instagram first.");
  }

  const tokenRow = data as MetaTokenRow;
  if (tokenRow.expires_at) {
    const expiresAt = new Date(tokenRow.expires_at).getTime();
    if (Number.isFinite(expiresAt) && expiresAt <= Date.now() + 60_000) {
      await markMetaReconnectRequired(client, "Stored Meta authorization has expired.");
      throw new MetaConnectionError("Meta authorization has expired. Reconnect Meta in Admin > Integrations.");
    }
  }

  const rootAccessToken = decryptIntegrationToken(tokenRow.access_token_ciphertext);
  const metadata = tokenRow.metadata && typeof tokenRow.metadata === "object" ? tokenRow.metadata : {};
  const configuredPageId = metadataString(metadata, "facebookPageId") || tokenRow.account_id?.trim() || null;
  const configuredInstagramId = metadataString(metadata, "instagramAccountId");

  if (!configuredPageId) {
    throw new MetaConnectionError("The connected Meta record does not contain a Facebook Page ID. Reconnect Meta in Integrations.");
  }

  let accounts: MetaAccountsPayload;
  try {
    accounts = await graphRequest<MetaAccountsPayload>("me/accounts", rootAccessToken, {
      params: {
        fields: "id,name,access_token,instagram_business_account{id,username}",
        limit: "100",
      },
    });
  } catch (error) {
    if (isAuthError(error)) await markMetaReconnectRequired(client, cleanError(error));
    throw error;
  }

  const page = (accounts.data || []).find((item) => item.id === configuredPageId);
  if (!page) {
    throw new MetaConnectionError(
      "The authorized Facebook Page is no longer available to this Meta connection. Reconnect Meta and select The Salt Origin Page.",
    );
  }

  const instagramAccountId = configuredInstagramId || page.instagram_business_account?.id?.trim() || null;
  const instagramUsername = metadataString(metadata, "instagramUsername") || page.instagram_business_account?.username?.trim() || null;

  return {
    graphVersion: graphVersion(),
    pageId: configuredPageId,
    pageName: page.name?.trim() || tokenRow.account_name?.trim() || "Facebook Page",
    pageAccessToken: page.access_token?.trim() || rootAccessToken,
    instagramAccountId,
    instagramUsername,
  };
}

function platformContent(post: SocialPostRow, platform: string) {
  const content = post.platform_content && typeof post.platform_content === "object" ? post.platform_content : {};
  const raw = content[platform];
  const item = raw && typeof raw === "object" ? (raw as JsonRecord) : {};
  return {
    title: typeof item.title === "string" ? item.title.trim() : "",
    text: typeof item.text === "string" ? item.text.trim() : String(post.caption || "").trim(),
    hashtags: typeof item.hashtags === "string" ? item.hashtags.trim() : String(post.hashtags || "").trim(),
  };
}

function platformImage(post: SocialPostRow, platform: string) {
  const images = post.platform_images && typeof post.platform_images === "object" ? post.platform_images : {};
  const candidate = images[platform];
  const value = typeof candidate === "string" && candidate.trim() ? candidate.trim() : String(post.image_url || "").trim();
  if (!value) return "";

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${platform === "instagram" ? "Instagram" : "Facebook"} image URL is invalid.`);
  }

  if (parsed.protocol !== "https:") {
    throw new Error(`${platform === "instagram" ? "Instagram" : "Facebook"} image must use a public HTTPS URL.`);
  }

  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
    throw new Error("Meta cannot fetch localhost/private image URLs. Use a public CMS Media Library image.");
  }

  return parsed.toString();
}

function joinedCaption(post: SocialPostRow, platform: string) {
  const item = platformContent(post, platform);
  return [item.text, item.hashtags].filter(Boolean).join("\n\n").trim();
}

function destinationLink(post: SocialPostRow) {
  const brief = post.brief && typeof post.brief === "object" ? post.brief : {};
  const candidate = typeof brief.link === "string" ? brief.link.trim() : "";
  if (!candidate) return undefined;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.toString();
  } catch {
    return undefined;
  }
  return undefined;
}

async function lookupFacebookPermalink(postId: string, accessToken: string) {
  try {
    const payload = await graphRequest<{ id?: string; permalink_url?: string }>(postId, accessToken, {
      params: { fields: "id,permalink_url" },
    });
    return payload.permalink_url || null;
  } catch {
    return null;
  }
}

async function publishFacebook(post: SocialPostRow, context: MetaPublishingContext): Promise<PlatformPublishResult> {
  const attemptedAt = new Date().toISOString();
  const imageUrl = platformImage(post, "facebook");
  const message = joinedCaption(post, "facebook");
  const link = destinationLink(post);

  if (!message && !imageUrl && !link) {
    throw new Error("Facebook post has no text, image, or destination link to publish.");
  }

  let externalPostId = "";

  if (imageUrl) {
    const caption = [message, link && !message.includes(link) ? link : ""].filter(Boolean).join("\n\n");
    const payload = await graphRequest<{ id?: string; post_id?: string }>(`${context.pageId}/photos`, context.pageAccessToken, {
      method: "POST",
      params: {
        url: imageUrl,
        caption,
        published: "true",
      },
    });
    externalPostId = payload.post_id || payload.id || "";
  } else {
    const payload = await graphRequest<{ id?: string }>(`${context.pageId}/feed`, context.pageAccessToken, {
      method: "POST",
      params: {
        message,
        link,
      },
    });
    externalPostId = payload.id || "";
  }

  if (!externalPostId) throw new Error("Facebook accepted the publish request but did not return a post ID.");

  return {
    status: "published",
    externalPostId,
    permalink: await lookupFacebookPermalink(externalPostId, context.pageAccessToken),
    publishedAt: new Date().toISOString(),
    attemptedAt,
  };
}

function shouldRetryInstagramPublish(error: unknown) {
  if (!(error instanceof MetaApiError)) return false;
  const message = error.message.toLowerCase();
  return error.code === 9007 || error.transient === true || message.includes("not ready") || message.includes("media id is not available");
}

async function publishInstagram(post: SocialPostRow, context: MetaPublishingContext): Promise<PlatformPublishResult> {
  const attemptedAt = new Date().toISOString();
  if (!context.instagramAccountId) {
    throw new MetaConnectionError("No linked Instagram Professional account is stored. Reconnect Meta after linking Instagram to the Facebook Page.");
  }

  const imageUrl = platformImage(post, "instagram");
  if (!imageUrl) {
    throw new Error("Instagram publishing requires a public HTTPS image. Add an approved image before publishing.");
  }

  const caption = joinedCaption(post, "instagram");
  const container = await graphRequest<{ id?: string }>(context.instagramAccountId + "/media", context.pageAccessToken, {
    method: "POST",
    params: {
      image_url: imageUrl,
      caption,
    },
  });

  if (!container.id) throw new Error("Instagram did not return a media container ID.");

  let published: { id?: string } | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    try {
      published = await graphRequest<{ id?: string }>(context.instagramAccountId + "/media_publish", context.pageAccessToken, {
        method: "POST",
        params: { creation_id: container.id },
      });
      break;
    } catch (error) {
      lastError = error;
      if (!shouldRetryInstagramPublish(error) || attempt === 3) throw error;
    }
  }

  if (!published?.id) {
    throw lastError || new Error("Instagram accepted the media container but did not return a published media ID.");
  }

  let permalink: string | null = null;
  try {
    const media = await graphRequest<{ id?: string; permalink?: string }>(published.id, context.pageAccessToken, {
      params: { fields: "id,permalink" },
    });
    permalink = media.permalink || null;
  } catch {
    permalink = null;
  }

  return {
    status: "published",
    externalPostId: published.id,
    permalink,
    publishedAt: new Date().toISOString(),
    attemptedAt,
  };
}

function normalizedPlatforms(post: SocialPostRow) {
  return Array.from(
    new Set(
      (Array.isArray(post.platforms) ? post.platforms : [])
        .map((item) => String(item).trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function previousResults(post: SocialPostRow) {
  return post.platform_results && typeof post.platform_results === "object"
    ? ({ ...post.platform_results } as Record<string, PlatformPublishResult | JsonRecord>)
    : {};
}

function alreadyPublished(value: PlatformPublishResult | JsonRecord | undefined) {
  return Boolean(value && typeof value === "object" && value.status === "published");
}

async function saveFinalState(
  client: SupabaseClient,
  post: SocialPostRow,
  results: Record<string, PlatformPublishResult | JsonRecord>,
  selectedPlatforms: string[],
) {
  const metaSelected = selectedPlatforms.filter((platform) => META_PLATFORMS.has(platform));
  const publishedPlatforms = metaSelected.filter((platform) => alreadyPublished(results[platform]));
  const failedPlatforms = metaSelected.filter((platform) => {
    const result = results[platform];
    return Boolean(result && typeof result === "object" && (result.status === "failed" || result.status === "connection_required"));
  });
  const remainingPlatforms = selectedPlatforms.filter((platform) => !META_PLATFORMS.has(platform));

  let status = "published";
  let approvalStatus = "Published";
  let lastError: string | null = null;

  if (failedPlatforms.length) {
    const connectionRequired = failedPlatforms.some((platform) => {
      const result = results[platform];
      return Boolean(result && typeof result === "object" && result.status === "connection_required");
    });
    status = connectionRequired ? "connection_required" : "failed";
    approvalStatus = connectionRequired ? String(post.approval_status || "Scheduled") : "Failed";
    lastError = failedPlatforms
      .map((platform) => {
        const result = results[platform];
        return `${platform}: ${result && typeof result === "object" && typeof result.error === "string" ? result.error : "Publishing failed."}`;
      })
      .join(" | ")
      .slice(0, 1000);
  } else if (remainingPlatforms.length) {
    status = "ready_for_adapter";
    approvalStatus = String(post.approval_status || "Scheduled");
    lastError = `Meta publishing is complete. Remaining platform adapters: ${remainingPlatforms.join(", ")}.`;
  }

  const now = new Date().toISOString();
  const { error } = await client
    .from("social_scheduled_posts")
    .update({
      status,
      approval_status: approvalStatus,
      platform_results: results,
      last_error: lastError,
      updated_at: now,
    })
    .eq("id", post.id);

  if (error) throw new Error(error.message);

  const message = status === "published"
    ? `Published successfully to ${publishedPlatforms.join(" and ")}.`
    : status === "ready_for_adapter"
      ? `Meta publishing completed. Remaining adapters: ${remainingPlatforms.join(", ")}.`
      : lastError || "Publishing failed.";

  return {
    postId: post.id,
    status,
    publishedPlatforms,
    failedPlatforms,
    remainingPlatforms,
    results,
    message,
  } satisfies MetaPostPublishSummary;
}

export async function publishMetaSocialPost(client: SupabaseClient, post: SocialPostRow): Promise<MetaPostPublishSummary> {
  const selectedPlatforms = normalizedPlatforms(post);
  const metaSelected = selectedPlatforms.filter((platform) => META_PLATFORMS.has(platform));
  const results = previousResults(post);

  if (!metaSelected.length) {
    for (const platform of selectedPlatforms) {
      if (!results[platform]) {
        results[platform] = {
          status: "not_supported",
          attemptedAt: new Date().toISOString(),
          error: "This patch currently publishes only Facebook and Instagram.",
        };
      }
    }
    return saveFinalState(client, post, results, selectedPlatforms);
  }

  const pending = metaSelected.filter((platform) => !alreadyPublished(results[platform]));
  if (!pending.length) return saveFinalState(client, post, results, selectedPlatforms);

  let context: MetaPublishingContext;
  try {
    context = await loadMetaPublishingContext(client);
  } catch (error) {
    const message = cleanError(error);
    for (const platform of pending) {
      results[platform] = {
        status: "connection_required",
        attemptedAt: new Date().toISOString(),
        error: message,
      };
    }
    return saveFinalState(client, post, results, selectedPlatforms);
  }

  for (const platform of pending) {
    try {
      results[platform] = platform === "facebook"
        ? await publishFacebook(post, context)
        : await publishInstagram(post, context);
    } catch (error) {
      if (isAuthError(error)) await markMetaReconnectRequired(client, cleanError(error));
      results[platform] = {
        status: error instanceof MetaConnectionError || isAuthError(error) ? "connection_required" : "failed",
        attemptedAt: new Date().toISOString(),
        error: cleanError(error),
        ...metaErrorDetails(error),
      };
    }
  }

  return saveFinalState(client, post, results, selectedPlatforms);
}

export async function claimSocialPost(client: SupabaseClient, postId: string, expectedStatuses: string[]) {
  const { data, error } = await client
    .from("social_scheduled_posts")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", postId)
    .in("status", expectedStatuses)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data || null) as SocialPostRow | null;
}

export async function failClaimedSocialPost(client: SupabaseClient, postId: string, error: unknown) {
  await client
    .from("social_scheduled_posts")
    .update({
      status: "failed",
      approval_status: "Failed",
      last_error: cleanError(error),
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);
}
