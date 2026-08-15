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
  if (requestInit.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort();
  callerSignal?.addEventListener("abort", abortFromCaller, { once: true });

  try {
    return await fetch(input, {
      ...requestInit,
      headers,
      cache: requestInit.cache || "no-store",
      signal: controller.signal,
    });
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
