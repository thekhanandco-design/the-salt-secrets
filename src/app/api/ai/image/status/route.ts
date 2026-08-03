import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
  await requireAdminUser(request);
  const apiKey = process.env.OPENAI_API_KEY;
  const configuredModel = process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1";
  if (!apiKey) return NextResponse.json({ connected:false, model:configuredModel, message:"OPENAI_API_KEY is not configured on the server." }, { status:503 });
  try {
    const response = await fetch("https://api.openai.com/v1/models", { headers:{ Authorization:`Bearer ${apiKey}` }, cache:"no-store" });
    const payload = await response.json().catch(()=>({}));
    if (!response.ok) return NextResponse.json({ connected:false, model:configuredModel, message:payload?.error?.message || "OpenAI API key could not be validated." }, { status:response.status });
    const ids = Array.isArray(payload?.data) ? payload.data.map((item:any)=>item.id) : [];
    const candidates = [configuredModel,"gpt-image-1","dall-e-3"];
    const available = candidates.find(model=>ids.includes(model)) || null;
    return NextResponse.json({ connected:true, configuredModel, availableModel:available, imageReady:!!available, message:available?`Image generation ready with ${available}.`:`API key is valid, but this project has no supported image model access.` });
  } catch {
    return NextResponse.json({ connected:false, model:configuredModel, message:"Could not reach OpenAI from the server." }, { status:503 });
  }
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ connected:false, message:error instanceof Error ? error.message : "Unable to check image integration." }, { status:500 });
  }
}
