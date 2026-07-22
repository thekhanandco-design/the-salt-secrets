import { Resend } from "resend";

type LeadPayload = {
  name?: string;
  email?: string;
  company?: string;
  whatsapp?: string;
  country?: string;
  product?: string;
  quantity?: string;
  message?: string;
};

const leadEmail = process.env.LEAD_NOTIFICATION_EMAIL || "thekhanandco@gmail.com";

function escapeHtml(value?: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendLeadEmail(payload: LeadPayload) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY missing. Email notification skipped.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: leadEmail,
    subject: `New Website Inquiry | ${payload.name || payload.product || "The Salt Origin"}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:760px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
        <div style="background:#C23B4A;padding:26px;color:white">
          <h1 style="margin:0;font-size:28px">New Website Inquiry</h1>
          <p style="margin:8px 0 0;opacity:.9">The Salt Origin lead notification</p>
        </div>
        <div style="padding:28px">
          <table style="width:100%;border-collapse:collapse">
            ${[
              ["Name", payload.name],
              ["Email", payload.email],
              ["Company", payload.company],
              ["WhatsApp", payload.whatsapp],
              ["Country", payload.country],
              ["Product", payload.product],
              ["Quantity", payload.quantity],
            ].map(([label, value]) => `<tr><td style="padding:12px;border-bottom:1px solid #eee;font-weight:bold;width:180px">${label}</td><td style="padding:12px;border-bottom:1px solid #eee">${escapeHtml(value || "Not Provided")}</td></tr>`).join("")}
          </table>
          <h2 style="margin:28px 0 10px">Message</h2>
          <div style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e5e7eb;padding:18px;border-radius:12px">${escapeHtml(payload.message || "No message provided")}</div>
        </div>
      </div>
    `,
  });
}

export async function sendCustomerAutoReply(payload: LeadPayload) {
  if (!process.env.RESEND_API_KEY || !payload.email) return;

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: payload.email,
    subject: "We received your inquiry | The Salt Origin",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
        <div style="background:#C23B4A;padding:24px;color:white"><h1 style="margin:0">Thank you</h1></div>
        <div style="padding:28px;color:#0f172a">
          <p>Dear ${escapeHtml(payload.name || "Customer")},</p>
          <p>We have received your inquiry. Our sales team will review your request and contact you shortly.</p>
          <p><strong>Product:</strong> ${escapeHtml(payload.product || "General Inquiry")}</p>
          <p>Regards,<br/>The Salt Origin Team</p>
        </div>
      </div>
    `,
  });
}

function buildWhatsAppText(payload: LeadPayload) {
  return [
    "NEW WEBSITE INQUIRY — THE SALT ORIGIN",
    "",
    `Name: ${payload.name || "Not provided"}`,
    `Email: ${payload.email || "Not provided"}`,
    `Company: ${payload.company || "Not provided"}`,
    `WhatsApp: ${payload.whatsapp || "Not provided"}`,
    `Country: ${payload.country || "Not provided"}`,
    `Product: ${payload.product || "General Inquiry"}`,
    `Quantity: ${payload.quantity || "Not provided"}`,
    "",
    "Message:",
    payload.message || "No message provided",
  ].join("\n");
}

export async function sendWhatsAppWebhook(payload: LeadPayload) {
  const webhook = process.env.WHATSAPP_WEBHOOK_URL;
  if (webhook) {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "The Salt Origin Website", text: buildWhatsAppText(payload), ...payload }),
    });
  }

  const token = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;
  const recipient = payload.whatsapp || process.env.WHATSAPP_NOTIFICATION_TO;
  if (!token || !phoneNumberId || !recipient) return;

  const response = await fetch(`https://graph.facebook.com/${process.env.WHATSAPP_GRAPH_VERSION || "v23.0"}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipient.replace(/[^0-9]/g, ""),
      type: "text",
      text: { preview_url: false, body: buildWhatsAppText(payload).slice(0, 4096) },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`WhatsApp notification failed: ${detail}`);
  }
}
