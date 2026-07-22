import { NextResponse } from "next/server";
import { sendWhatsAppWebhook } from "@/lib/notifications";
export async function POST(request: Request) {
  try {
    const { phone, message } = await request.json();
    await sendWhatsAppWebhook({ name:"CMS Test", whatsapp:phone, product:"WhatsApp Connection Test", message:message || "Test notification from The Salt Origin CMS" });
    return NextResponse.json({ success:true });
  } catch (error) {
    return NextResponse.json({ error:error instanceof Error ? error.message : "WhatsApp test failed." }, { status:500 });
  }
}
