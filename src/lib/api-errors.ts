export function publicApiError(error: unknown, fallback = "Request failed") {
  if (process.env.NODE_ENV === "production") return fallback;
  const raw = error instanceof Error ? error.message : String(error || fallback);
  return raw
    .replace(/sk-(proj-)?[A-Za-z0-9_-]{10,}/g, "[REDACTED_API_KEY]")
    .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+=*/gi, "Bearer [REDACTED]")
    .slice(0, 500) || fallback;
}
