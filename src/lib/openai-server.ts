export type OpenAIRequestOptions = {
  input: string;
  model?: string;
  tools?: Array<Record<string, unknown>>;
};

function extractOutputText(payload: any): string {
  if (typeof payload?.output_text === "string") return payload.output_text;
  return (payload?.output || [])
    .flatMap((item: any) => item?.content || [])
    .map((part: any) => part?.text || part?.output_text || "")
    .join("");
}

export function parseJsonResponse(raw: string) {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first >= 0 && last > first) return JSON.parse(cleaned.slice(first, last + 1));
    throw new Error("AI returned invalid JSON. Please try again.");
  }
}

export async function runOpenAI(options: OpenAIRequestOptions) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing in .env.local or Vercel Environment Variables.");

  const models = Array.from(new Set([
    options.model,
    process.env.OPENAI_MODEL,
    "gpt-5-mini",
    "gpt-4.1-mini",
    "gpt-4o-mini",
  ].filter(Boolean) as string[]));

  let lastError = "OpenAI request failed.";
  for (const model of models) {
    for (const withTools of options.tools?.length ? [true, false] : [false]) {
      const body: Record<string, unknown> = { model, input: options.input };
      if (withTools) body.tools = options.tools;
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        const text = extractOutputText(payload);
        if (text.trim()) return { text, model };
        lastError = `Model ${model} returned an empty response.`;
      } else {
        lastError = payload?.error?.message || `OpenAI request failed with status ${response.status}.`;
      }
    }
  }
  throw new Error(lastError);
}
