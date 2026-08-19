export function isLoopbackHostname(value: string) {
  const hostname = value.trim().toLowerCase().replace(/^\[|\]$/g, "");
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function isLocalBrowserDevelopment() {
  return process.env.NODE_ENV !== "production" && typeof window !== "undefined" && isLoopbackHostname(window.location.hostname);
}

export function isLocalDevelopmentRequest(request: Request) {
  if (process.env.NODE_ENV === "production") return false;
  try {
    const requestUrl = new URL(request.url);
    if (!isLoopbackHostname(requestUrl.hostname)) return false;
    const origin = request.headers.get("origin");
    if (!origin) return true;
    return isLoopbackHostname(new URL(origin).hostname);
  } catch {
    return false;
  }
}
