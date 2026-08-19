"use client";

import { supabase } from "@/lib/supabase-client";

type AdminFetchInit = RequestInit & {
  timeoutMs?: number;
};

export async function adminFetch(input: string, init: AdminFetchInit = {}) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Your admin session has expired. Please sign in again.");
  }

  const { timeoutMs = 120_000, signal: callerSignal, ...requestInit } = init;
  const headers = new Headers(requestInit.headers || {});
  headers.set("Authorization", `Bearer ${data.session.access_token}`);
  if (requestInit.body && !(requestInit.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort();
  callerSignal?.addEventListener("abort", abortFromCaller, { once: true });

  try {
    const response = await fetch(input, {
      ...requestInit,
      headers,
      cache: requestInit.cache || "no-store",
      signal: controller.signal,
    });
    if (response.status === 403) {
      const payload = await response.clone().json().catch(() => null) as { code?: string } | null;
      if (payload?.code === "MFA_REQUIRED" && typeof window !== "undefined") {
        const returnTo = `${window.location.pathname}${window.location.search}`;
        window.location.assign(`/admin/mfa?return=${encodeURIComponent(returnTo)}`);
      }
    }
    return response;
  } catch (reason) {
    if (controller.signal.aborted && !callerSignal?.aborted) {
      throw new Error("This operation took too long. Please retry; the AI service did not respond in time.");
    }
    throw reason;
  } finally {
    window.clearTimeout(timeout);
    callerSignal?.removeEventListener("abort", abortFromCaller);
  }
}

export type AdminUploadKind = "website-image" | "product-image" | "blog-image" | "cms-image" | "favicon" | "certificate" | "document";

export async function adminUpload(file: Blob, kind: AdminUploadKind, options: { folder?: string; filename?: string } = {}) {
  const form = new FormData();
  const inferredName = typeof File !== "undefined" && file instanceof File ? file.name : "upload.bin";
  form.append("file", file, options.filename || inferredName);
  form.append("kind", kind);
  form.append("folder", options.folder || "general");
  const response = await adminFetch("/api/admin/upload", { method: "POST", body: form, timeoutMs: 120_000 });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.value) throw new Error(payload?.error || "File upload failed.");
  return payload as { success: true; value: string; previewUrl: string | null; bucket: string; path: string; mime: string; size: number };
}
