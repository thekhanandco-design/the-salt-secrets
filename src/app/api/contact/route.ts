import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendCustomerAutoReply, sendLeadEmail, sendWhatsAppWebhook } from "@/lib/notifications";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    const lead = {
      name: payload.name || "",
      email: payload.email || "",
      company: payload.company || "",
      whatsapp: payload.whatsapp || payload.phone || "",
      country: payload.country || "",
      product: payload.product || "General Inquiry",
      quantity: payload.quantity || "",
      message: payload.message || "",
      status: "new",
    };

    const { error } = await supabase.from("inquiries").insert([lead]);
    if (error) console.error("SUPABASE INQUIRY ERROR:", error.message);

    await Promise.allSettled([
      sendLeadEmail(lead),
      sendCustomerAutoReply(lead),
      sendWhatsAppWebhook(lead),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
