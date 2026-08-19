import { Resend } from "resend";
import { requireAdminUser } from "@/lib/admin-auth";
import { resolveStoredFileUrl } from "@/lib/private-storage";
import { logAdminSecurityEvent } from "@/lib/security/audit";
import { distributedRateLimit, readJson, secureJson, validUuid } from "@/lib/security/http";

function esc(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char] || char));
}

export async function POST(request: Request) {
  try {
    const { client, identity } = await requireAdminUser(request);
    const limited = await distributedRateLimit(request, { key: "admin-certification-send", limit: 20, windowMs: 10 * 60_000 });
    if (limited) return limited;

    const body = await readJson(request, 20_000);
    const inquiryId = Number(body.inquiryId || 0);
    const certIds = Array.isArray(body.certificationIds)
      ? Array.from(new Set(body.certificationIds.map(String).filter(validUuid))).slice(0, 25)
      : [];
    if (!Number.isSafeInteger(inquiryId) || inquiryId <= 0 || !certIds.length) {
      return secureJson({ error: "A valid request and approved documents are required." }, { status: 400 });
    }

    const [{ data: inquiry, error: inquiryError }, { data: certificates, error: certificateError }] = await Promise.all([
      client.from("inquiries").select("id,name,email,whatsapp,company,metadata").eq("id", inquiryId).maybeSingle(),
      client.from("certifications").select("id,document_name,file_url,status,visibility").in("id", certIds),
    ]);
    if (inquiryError || !inquiry) return secureJson({ error: "Request not found." }, { status: 404 });
    if (certificateError) return secureJson({ error: "Approved documents could not be loaded." }, { status: 500 });

    const selected = (certificates || []).filter((item) => item.file_url && certIds.includes(String(item.id)));
    if (!selected.length) return secureJson({ error: "Selected certificates do not have approved files." }, { status: 400 });

    // Private compliance documents are delivered with short-lived signed links.
    const documents = await Promise.all(selected.map(async (item) => ({
      id: String(item.id),
      document_name: String(item.document_name || "Compliance document"),
      url: await resolveStoredFileUrl(client, String(item.file_url), 24 * 60 * 60),
    })));
    const links = documents.map((item) => `${item.document_name}: ${item.url}`).join("\n");

    let emailSent = false;
    let whatsappSent = false;
    if (body.email !== false && inquiry.email && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || "onboarding@resend.dev";
      const html = `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto"><h2 style="color:#9f1838">The Salt Origin — Requested Documents</h2><p>Dear ${esc(inquiry.name || "Buyer")},</p><p>Your requested compliance documents have been approved for time-limited access.</p>${documents.map((item) => `<p><a href="${esc(item.url)}">${esc(item.document_name)}</a></p>`).join("")}<p>Regards,<br>The Salt Origin</p></div>`;
      const result = await resend.emails.send({ from, to: String(inquiry.email), subject: "Requested certificates and compliance documents | The Salt Origin", html });
      emailSent = !result.error;
    }

    if (body.whatsapp !== false && inquiry.whatsapp && process.env.WHATSAPP_CLOUD_ACCESS_TOKEN && process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID) {
      const response = await fetch(`https://graph.facebook.com/${process.env.WHATSAPP_GRAPH_VERSION || "v23.0"}/${process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_ACCESS_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: String(inquiry.whatsapp).replace(/[^0-9]/g, ""),
          type: "text",
          text: { preview_url: true, body: `The Salt Origin — your requested documents are approved for time-limited access.\n\n${links}`.slice(0, 4096) },
        }),
        cache: "no-store",
      });
      whatsappSent = response.ok;
    }

    const metadata = {
      ...(inquiry.metadata || {}),
      request_status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: identity.email,
      certification_ids: documents.map((item) => item.id),
      email_sent: emailSent,
      whatsapp_sent: whatsappSent,
    };
    await client.from("inquiries").update({ status: "approved", metadata, updated_at: new Date().toISOString() }).eq("id", inquiryId);
    await logAdminSecurityEvent(client, identity, "certification_access_approved", { inquiry_id: inquiryId, document_count: documents.length, email_sent: emailSent, whatsapp_sent: whatsappSent });

    const whatsappUrl = inquiry.whatsapp
      ? `https://wa.me/${String(inquiry.whatsapp).replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`The Salt Origin — your requested documents are approved for time-limited access.\n\n${links}`)}`
      : null;
    return secureJson({ success: true, emailSent, whatsappSent, whatsappUrl });
  } catch (error) {
    if (error instanceof Response) return error;
    const status = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? 413 : 500;
    return secureJson({ error: status === 413 ? "Request is too large." : "Unable to send approved documents." }, { status });
  }
}
