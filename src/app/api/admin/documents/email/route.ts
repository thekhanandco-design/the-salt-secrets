import { publicApiError } from "@/lib/api-errors";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdminUser } from "@/lib/admin-auth";
import { buildExportDocumentPdf, type ExportDocumentPayload } from "@/lib/export-document-pdf";
import { distributedRateLimit, readJson, validEmail } from "@/lib/security/http";

function esc(value: unknown) { return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char] || char)); }

export async function POST(request: Request) {
  try {
    const { client, identity } = await requireAdminUser(request);
    const limited = await distributedRateLimit(request, { key: `document-email:${identity.id}`, limit: 30, windowMs: 10 * 60_000 });
    if (limited) return limited;
    const body = await readJson(request, 180_000) as { document: ExportDocumentPayload & { id?: string }; subject?: string; message?: string; attachPdf?: boolean };
    const document = body.document;
    if (!document?.buyer_email || !validEmail(String(document.buyer_email))) return NextResponse.json({ error: "A valid client email is required." }, { status: 400 });
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM;
    if (!apiKey || !from) return NextResponse.json({ error: "Email service is unavailable." }, { status: 503 });

    const resend = new Resend(apiKey);
    const filename = `${String(document.document_number || "document").replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf`;
    const pdf = body.attachPdf === false ? null : buildExportDocumentPdf(document);
    const products = (document.items || []).map(item => `${item.product || "Product"} — ${Number(item.quantity || 0)} ${item.unit || ""}`).join("<br>");
    const defaultMessage = `Please find our ${String(document.document_type || "quotation").replaceAll("_", " ")} ${document.document_number || ""}.`;
    const html = `
      <div style="font-family:Arial,sans-serif;color:#20242c;line-height:1.65;max-width:680px;margin:auto">
        <div style="border-top:5px solid #d94f72;padding:28px 0 12px"><h2 style="margin:0;color:#d94f72">${esc(document.company_name || "The Salt Origin")}</h2></div>
        <p>Dear ${esc(document.buyer_name || "Client")},</p>
        <p>${esc(body.message || defaultMessage)}</p>
        <div style="background:#faf5f7;border:1px solid #f0dce3;border-radius:12px;padding:16px;margin:20px 0">
          <strong>Document:</strong> ${esc(document.document_number || "Draft")}<br>
          <strong>Products:</strong><br>${products || "—"}<br>
          <strong>Incoterm:</strong> ${esc(document.incoterm || "—")}<br>
          <strong>Validity:</strong> ${esc(document.valid_until || "—")}
        </div>
        <p>Kindly review the document and reply with any required revision.</p>
        <p>Regards,<br><strong>${esc(identity.fullName)}</strong><br>${esc(document.company_name || "The Salt Origin")}</p>
      </div>`;

    const result = await resend.emails.send({
      from,
      to: document.buyer_email,
      subject: body.subject || `${String(document.document_type || "Quotation").replaceAll("_", " ")} ${document.document_number || ""}`,
      html,
      attachments: pdf ? [{ filename, content: pdf.toString("base64") }] : undefined,
    });
    if (result.error) return NextResponse.json({ error: "Email could not be sent." }, { status: 502 });

    if (document.id) await client.from("business_documents").update({ status: "Sent", sent_at: new Date().toISOString(), email_message: body.message || defaultMessage }).eq("id", document.id);
    await client.from("b2b_activities").insert({ activity_type: "Email", module: "Quotations", record_id: document.id || document.document_number || null, title: `${document.document_number || "Document"} sent by email`, description: `Sent to ${document.buyer_email}`, actor_id: identity.id, actor_email: identity.email });
    return NextResponse.json({ success: true, id: result.data?.id || null });
  } catch (error) {
    if (error instanceof Response) return error;
    const status = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? 413 : 500;
    return NextResponse.json({ error: status === 413 ? "Request is too large." : publicApiError(error, "Unable to send email.") }, { status });
  }
}
