import { NextResponse } from "next/server";
import { publicApiError } from "@/lib/api-errors";
import { requireAdminUser } from "@/lib/admin-auth";

type ImageResult = { image: string; revisedPrompt: string; model: string };

function isModelAccessError(message: string) {
  const value = message.toLowerCase();
  return value.includes("does not have access") || value.includes("model_not_found") || value.includes("not found") || value.includes("permission");
}

async function generateWithModel(apiKey: string, model: string, prompt: string, requestedSize: string): Promise<ImageResult> {
  const legacy = model.startsWith("dall-e");
  const size = legacy ? (requestedSize === "1536x1024" ? "1792x1024" : "1024x1024") : requestedSize;
  const body: Record<string, unknown> = { model, prompt, size, n: 1 };
  if (legacy) {
    body.quality = "hd";
    body.response_format = "b64_json";
  } else {
    body.quality = "high";
    body.output_format = "png";
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `Image generation failed with ${model}.`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  const item = payload?.data?.[0];
  if (item?.b64_json) return { image: `data:image/png;base64,${item.b64_json}`, revisedPrompt: item.revised_prompt || prompt, model };
  if (item?.url) return { image: item.url, revisedPrompt: item.revised_prompt || prompt, model };
  throw new Error(`${model} returned no image.`);
}

export async function POST(request: Request) {
  try {
    await requireAdminUser(request);
    const { prompt, size = "1536x1024" } = await request.json();
    if (!prompt?.trim()) return NextResponse.json({ error: "Image prompt is required." }, { status: 400 });
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });

    const configured = process.env.OPENAI_IMAGE_MODEL?.trim();
    const models = Array.from(new Set([configured, "gpt-image-1", "dall-e-3"].filter(Boolean))) as string[];
    const failures: string[] = [];

    for (const model of models) {
      try {
        const result = await generateWithModel(apiKey, model, prompt.trim(), size);
        return NextResponse.json({ image: result.image, revised_prompt: result.revisedPrompt, model: result.model });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown image error";
        failures.push(`${model}: ${message}`);
        if (!isModelAccessError(message) && model === configured) break;
      }
    }

    return NextResponse.json({
      error: "No image model available for this OpenAI project. Enable gpt-image-1 access or set OPENAI_IMAGE_MODEL=dall-e-3, then try again.",
      details: failures,
    }, { status: 503 });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: publicApiError(error, "Image generation failed.") }, { status: 500 });
  }
}
