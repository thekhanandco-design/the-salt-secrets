import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { phone, message } = await request.json();
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const recipient = String(phone || process.env.WHATSAPP_ADMIN_NUMBER || "").replace(/\D/g, "");

    if (!token || !phoneNumberId) {
      return NextResponse.json({ error: "WhatsApp Cloud API environment variables are missing." }, { status: 500 });
    }
    if (!recipient) return NextResponse.json({ error: "Recipient number is required." }, { status: 400 });

    const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "text",
        text: { body: message || "Test notification from The Salt Origin CMS" },
      }),
    });

    const payload = await response.json();
    if (!response.ok) return NextResponse.json({ error: payload?.error?.message || "WhatsApp API request failed." }, { status: response.status });
    return NextResponse.json({ success: true, payload });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "WhatsApp test failed." }, { status: 500 });
  }
}
