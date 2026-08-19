import type { SupabaseClient } from "@supabase/supabase-js";

function parseStorageReference(value: string) {
  if (value.startsWith("supabase://")) {
    const rest = value.slice("supabase://".length);
    const slash = rest.indexOf("/");
    if (slash > 0) return { bucket: rest.slice(0, slash), path: rest.slice(slash + 1) };
  }
  try {
    const url = new URL(value);
    const match = url.pathname.match(/\/storage\/v1\/object\/(?:public\/|sign\/)?([^/]+)\/(.+)$/);
    if (match) return { bucket: decodeURIComponent(match[1]), path: decodeURIComponent(match[2]) };
  } catch {
    // Not a URL; leave it unchanged.
  }
  return null;
}

export async function resolveStoredFileUrl(client: SupabaseClient, value: string, expiresIn = 60 * 60) {
  const reference = parseStorageReference(value);
  if (!reference) return value;
  const mustSign = reference.bucket === "cms-private"
    || reference.bucket === "certificates"
    || reference.bucket === "documents"
    || (reference.bucket === "cms-media" && (reference.path.startsWith("certifications/") || reference.path.startsWith("documents/")));
  if (!mustSign) return value;
  const { data, error } = await client.storage.from(reference.bucket).createSignedUrl(reference.path, expiresIn);
  if (error || !data?.signedUrl) throw new Error("Unable to create approved document access link.");
  return data.signedUrl;
}
