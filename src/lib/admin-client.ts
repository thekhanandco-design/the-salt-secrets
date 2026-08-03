"use client";

import { supabase } from "@/lib/supabase-client";

export async function adminFetch(input: string, init: RequestInit = {}) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error("Your admin session has expired. Please sign in again.");
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${data.session.access_token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(input, { ...init, headers, cache: init.cache || "no-store" });
}
