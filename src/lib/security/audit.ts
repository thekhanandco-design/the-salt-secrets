import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminIdentity } from "@/lib/admin-auth";

const BLOCKED_KEYS = /password|token|secret|credential|authorization|cookie|api[_-]?key/i;

function safeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (BLOCKED_KEYS.test(key)) continue;
    if (["string", "number", "boolean"].includes(typeof item) || item === null) {
      output[key] = typeof item === "string" ? item.slice(0, 500) : item;
    }
  }
  return output;
}

export async function logAdminSecurityEvent(
  client: SupabaseClient,
  identity: AdminIdentity,
  event: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    await client.from("b2b_activities").insert({
      module: "Security",
      activity_type: event,
      title: event.replaceAll("_", " "),
      description: `${identity.fullName} (${identity.email})`,
      metadata: { actor_id: identity.id, actor_role: identity.roleSlug, ...safeMetadata(metadata) },
    });
  } catch {
    // Security logging is best-effort and must never expose/log secrets or break the action.
  }
}
