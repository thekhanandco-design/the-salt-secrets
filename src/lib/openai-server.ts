export type OpenAIRequestOptions = {
  input: string;
  model?: string;
  tools?: Array<Record<string, unknown>>;
  timeoutMs?: number;
  totalTimeoutMs?: number;
  maxAttempts?: number;
};

function extractOutputText(payload: any): string {
  if (typeof payload?.output_text === "string") return payload.output_text;
  return (payload?.output || [])
    .flatMap((item: any) => item?.content || [])
    .map((part: any) => part?.text || part?.output_text || "")
    .join("");
}

export function parseJsonResponse(raw: string) {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first >= 0 && last > first) return JSON.parse(cleaned.slice(first, last + 1));
    throw new Error("AI returned invalid JSON. Please try again.");
  }
}

async function fetchOpenAI(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function runOpenAI(options: OpenAIRequestOptions) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing in .env.local or Vercel Environment Variables.");
  }

  const models = Array.from(
    new Set(
      [
        options.model,
        process.env.OPENAI_CONTENT_MODEL,
        process.env.OPENAI_MODEL,
        process.env.OPENAI_FALLBACK_MODEL,
        "gpt-4o-mini",
        "gpt-4.1-mini",
      ].filter(Boolean) as string[],
    ),
  );

  const timeoutMs = Math.max(20_000, Number(options.timeoutMs || process.env.OPENAI_REQUEST_TIMEOUT_MS || 55_000));
  const totalTimeoutMs = Math.max(timeoutMs, Number(options.totalTimeoutMs || process.env.OPENAI_TOTAL_TIMEOUT_MS || 110_000));
  const deadline = Date.now() + totalTimeoutMs;
  let lastError = "OpenAI request failed.";
  const attempts = models
    .flatMap((model) => (options.tools?.length ? [{ model, withTools: true }, { model, withTools: false }] : [{ model, withTools: false }]))
    .slice(0, Math.max(1, options.maxAttempts || 6));

  for (const attempt of attempts) {
    const remaining = deadline - Date.now();
    if (remaining < 2_000) break;
    const body: Record<string, unknown> = { model: attempt.model, input: options.input };
    if (attempt.withTools) body.tools = options.tools;

    try {
      const response = await fetchOpenAI(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
          cache: "no-store",
        },
        Math.min(timeoutMs, remaining),
      );

      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        const text = extractOutputText(payload);
        if (text.trim()) return { text, model: attempt.model };
        lastError = `Model ${attempt.model} returned an empty response.`;
      } else {
        lastError = payload?.error?.message || `OpenAI request failed with status ${response.status}.`;
      }
    } catch (reason) {
      const timedOut = reason instanceof Error && reason.name === "AbortError";
      lastError = timedOut
        ? `Model ${attempt.model}${attempt.withTools ? " web research" : " generation"} timed out.`
        : reason instanceof Error
          ? reason.message
          : "OpenAI request failed.";
    }
  }

  throw new Error(lastError);
}
