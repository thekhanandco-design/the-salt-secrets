import { publicApiError } from "@/lib/api-errors";
import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import { buildExportDocumentPdf, type ExportDocumentPayload } from "@/lib/export-document-pdf";
import { cleanText, distributedRateLimit, readJson } from "@/lib/security/http";

export async function POST(request: Request) {
  try {
    const { client, identity } = await requireAdminUser(request);
    const limited = await distributedRateLimit(request, { key: `document-whatsapp:${identity.id}`, limit: 20, windowMs: 10 * 60_000 });
    if (limited) return limited;
    const body = await readJson(request, 180_000) as { document: ExportDocumentPayload & { id?: string }; message?: string };
    const document = body.document;
    if (!document?.buyer_phone) return NextResponse.json({ error: "Client WhatsApp number is required." }, { status: 400 });
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
    if (!phoneNumberId || !token) return NextResponse.json({ error: "WhatsApp service is unavailable." }, { status: 503 });
    const version = process.env.WHATSAPP_GRAPH_VERSION || "v21.0";
    const filename = `${String(document.document_number || "document").replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf`;
    const pdf = buildExportDocumentPdf(document);

    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("type", "application/pdf");
    form.append("file", new Blob([pdf], { type: "application/pdf" }), filename);
    const upload = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/media`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
    const uploadPayload = await upload.json().catch(() => ({}));
    if (!upload.ok || !uploadPayload.id) return NextResponse.json({ error: "WhatsApp media upload failed." }, { status: 502 });

    const message = cleanText(body.message, 2_000) || `Dear ${document.buyer_name || "Client"}, please find ${String(document.document_type || "quotation").replaceAll("_", " ")} ${document.document_number || ""} attached.`;
    const send = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: document.buyer_phone.replace(/\D/g, ""), type: "document", document: { id: uploadPayload.id, filename, caption: message } }),
    });
    const sendPayload = await send.json().catch(() => ({}));
    if (!send.ok) return NextResponse.json({ error: "WhatsApp send failed." }, { status: 502 });

    if (document.id) await client.from("business_documents").update({ status: "Sent", sent_at: new Date().toISOString(), whatsapp_message: message }).eq("id", document.id);
    await client.from("b2b_activities").insert({ activity_type: "WhatsApp", module: "Quotations", record_id: document.id || document.document_number || null, title: `${document.document_number || "Document"} sent by WhatsApp`, description: `Sent to ${document.buyer_phone}`, actor_id: identity.id, actor_email: identity.email });
    return NextResponse.json({ success: true, messageId: sendPayload?.messages?.[0]?.id || null });
  } catch (error) {
    if (error instanceof Response) return error;
    const status = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? 413 : 500;
    return NextResponse.json({ error: status === 413 ? "Request is too large." : publicApiError(error, "Unable to send WhatsApp document.") }, { status });
  }
}
