export function publicApiError(error: unknown, fallback = "Request failed") {
  const raw = error instanceof Error ? error.message : String(error || fallback);
  const lower = raw.toLowerCase();
  if (lower.includes("incorrect api key") || lower.includes("invalid_api_key") || lower.includes("authentication")) {
    return "OpenAI authentication failed. Replace OPENAI_API_KEY in .env.local or Vercel and restart the app.";
  }
  if (lower.includes("quota") || lower.includes("billing") || lower.includes("insufficient_quota")) {
    return "OpenAI billing or quota is unavailable. Check the API project billing and usage limits.";
  }
  return raw.replace(/sk-(proj-)?[A-Za-z0-9_-]{10,}/g, "[REDACTED_API_KEY]").slice(0, 500) || fallback;
}
