import { Resend } from "resend";

type LeadPayload = {
  name?: string;
  email?: string;
  company?: string;
  whatsapp?: string;
  country?: string;
  product?: string;
  quantity?: string;
  estimatedAnnualVolume?: string;
  privateLabelRequired?: string;
  targetMarket?: string;
  incotermPreference?: string;
  message?: string;
};

const leadEmail = process.env.LEAD_NOTIFICATION_EMAIL || "thekhanandco@gmail.com";
const salesReplyEmail = process.env.RESEND_REPLY_TO_EMAIL || "sales@thesaltorigin.com";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.thesaltorigin.com").replace(/\/$/, "");
const emailLogoUrl = process.env.EMAIL_LOGO_URL || `${siteUrl}/salt-origin-logo.png`;
const defaultSender = "The Salt Origin <sales@thesaltorigin.com>";

function escapeHtml(value?: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function senderAddress() {
  return process.env.RESEND_FROM_EMAIL?.trim() || defaultSender;
}

function logoBlock() {
  return `<span style="display:inline-block;background:#ffffff;border-radius:10px;padding:7px 10px;line-height:0"><img src="${escapeHtml(emailLogoUrl)}" alt="The Salt Origin" width="104" style="display:block;max-width:104px;height:auto;border:0;outline:none;text-decoration:none" /></span>`;
}

function emailShell(content: string, badge: string) {
  return `
    <div style="margin:0;padding:28px 12px;background:#f8f5f3;font-family:Arial,Helvetica,sans-serif;color:#171717">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #eadfde;border-radius:18px;overflow:hidden;box-shadow:0 12px 36px rgba(55,24,30,.08)">
        <div style="padding:18px 24px;background:linear-gradient(135deg,#db718c 0%,#c43b5a 52%,#a9193d 100%);color:#ffffff">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="left" valign="middle">${logoBlock()}</td>
              <td align="right" valign="middle">
                <div style="font-size:11px;font-weight:800;letter-spacing:1.7px;text-transform:uppercase;color:#ffffff">${escapeHtml(badge)}</div>
                <div style="margin-top:6px;font-size:12px;color:#ffe8ef">THE SALT ORIGIN</div>
              </td>
            </tr>
          </table>
        </div>
        ${content}
        <div style="padding:18px 28px;background:#17181c;color:#c9c9ce;font-size:12px;line-height:1.7">
          <strong style="color:#ffffff">The Salt Origin</strong><br/>
          Premium Himalayan Pink Salt · Pakistan<br/>
          <a href="${escapeHtml(siteUrl)}" style="color:#ef6b85;text-decoration:none">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a>
          &nbsp;·&nbsp;
          <a href="mailto:${escapeHtml(salesReplyEmail)}" style="color:#ef6b85;text-decoration:none">${escapeHtml(salesReplyEmail)}</a>
        </div>
      </div>
    </div>
  `;
}

async function sendResendEmail(args: Parameters<Resend["emails"]["send"]>[0]) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY missing. Email delivery skipped.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send(args);
  if (result.error) {
    console.error("[email] Resend delivery failed", {
      name: result.error.name,
      message: result.error.message,
    });
    throw new Error(result.error.message);
  }
}

export async function sendLeadEmail(payload: LeadPayload) {
  const from = senderAddress();
  const safeBuyerEmail = escapeHtml(payload.email || "Not Provided");

  const rows = [
    ["Name", payload.name],
    ["Email", payload.email],
    ["Company", payload.company],
    ["Phone", payload.whatsapp],
    ["Target Market", payload.targetMarket || payload.country],
    ["Product Category", payload.product],
    ["Estimated Quantity", payload.quantity],
    ["Estimated Annual Volume", payload.estimatedAnnualVolume],
    ["Private Label Required", payload.privateLabelRequired],
    ["Incoterm Preference", payload.incotermPreference],
  ]
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f0e7e7;font-size:13px;font-weight:700;color:#6b5b5d;width:170px">${escapeHtml(label)}</td>
          <td style="padding:12px 0;border-bottom:1px solid #f0e7e7;font-size:14px;color:#171717">${escapeHtml(value || "Not Provided")}</td>
        </tr>`,
    )
    .join("");

  const html = emailShell(
    `
      <div style="padding:28px">
        <p style="margin:0 0 7px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#b52142">Website quote request</p>
        <h1 style="margin:0 0 10px;font-size:30px;line-height:1.2;color:#171717">New website inquiry</h1>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.65;color:#655b5d">A new B2B buyer request has been submitted through The Salt Origin website.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse">${rows}</table>
        <div style="margin-top:26px">
          <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#b52142;text-transform:uppercase;letter-spacing:1px">Buyer message</p>
          <div style="white-space:pre-wrap;background:#fbf8f7;border:1px solid #eadfde;padding:18px;border-radius:12px;font-size:14px;line-height:1.7;color:#30292a">${escapeHtml(payload.message || "No message provided")}</div>
        </div>
        ${payload.email ? `<div style="margin-top:24px"><a href="mailto:${safeBuyerEmail}" style="display:inline-block;background:#b52142;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:12px 18px;border-radius:8px">Reply to buyer</a></div>` : ""}
      </div>
    `,
    "NEW INQUIRY",
  );

  await sendResendEmail({
    from,
    to: leadEmail,
    replyTo: payload.email || salesReplyEmail,
    subject: `New Website Inquiry | ${payload.name || "Buyer"} | ${payload.product || "General"}`,
    html,
  });
}

export async function sendCustomerAutoReply(payload: LeadPayload) {
  if (!payload.email) return;

  const from = senderAddress();
  const firstName = String(payload.name || "Buyer").trim().split(/\s+/)[0] || "Buyer";

  const html = emailShell(
    `
      <div style="padding:30px 28px;color:#30292a;font-size:15px;line-height:1.75">
        <p style="margin:0 0 7px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#b52142">Request received</p>
        <h1 style="margin:0 0 14px;font-size:30px;line-height:1.2;color:#171717">Thank you, ${escapeHtml(firstName)}.</h1>
        <p style="margin:0 0 16px">Thank you for contacting <strong>The Salt Origin</strong>. Your inquiry has been received by our export sales team.</p>
        <p style="margin:0 0 22px">We will review the selected products, expected order volume, target market and commercial requirements, then contact you with the relevant product information and next steps.</p>
        <div style="background:#fbf8f7;border:1px solid #eadfde;border-radius:12px;padding:18px 20px;margin:0 0 22px">
          <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#b52142;margin-bottom:8px">Inquiry summary</div>
          <div><strong>Product Category:</strong> ${escapeHtml(payload.product || "General Inquiry")}</div>
          ${payload.quantity ? `<div style="margin-top:5px"><strong>Estimated Quantity:</strong> ${escapeHtml(payload.quantity)}</div>` : ""}
          ${payload.estimatedAnnualVolume ? `<div style="margin-top:5px"><strong>Annual Volume:</strong> ${escapeHtml(payload.estimatedAnnualVolume)}</div>` : ""}
          ${payload.privateLabelRequired ? `<div style="margin-top:5px"><strong>Private Label:</strong> ${escapeHtml(payload.privateLabelRequired)}</div>` : ""}
          ${(payload.targetMarket || payload.country) ? `<div style="margin-top:5px"><strong>Target Market:</strong> ${escapeHtml(payload.targetMarket || payload.country)}</div>` : ""}
          ${payload.incotermPreference ? `<div style="margin-top:5px"><strong>Incoterm:</strong> ${escapeHtml(payload.incotermPreference)}</div>` : ""}
        </div>
        <p style="margin:0">If you want to add anything to your request, simply reply to this email.</p>
        <p style="margin:22px 0 0">Warm regards,<br/><strong>The Salt Origin Export Team</strong></p>
      </div>
    `,
    "INQUIRY RECEIVED",
  );

  await sendResendEmail({
    from,
    to: payload.email,
    replyTo: salesReplyEmail,
    subject: "We received your inquiry | The Salt Origin",
    html,
  });
}

function buildWhatsAppText(payload: LeadPayload) {
  return [
    "NEW WEBSITE INQUIRY — THE SALT ORIGIN",
    "",
    `Name: ${payload.name || "Not provided"}`,
    `Email: ${payload.email || "Not provided"}`,
    `Company: ${payload.company || "Not provided"}`,
    `Phone: ${payload.whatsapp || "Not provided"}`,
    `Target Market: ${payload.targetMarket || payload.country || "Not provided"}`,
    `Product Category: ${payload.product || "General Inquiry"}`,
    `Estimated Quantity: ${payload.quantity || "Not provided"}`,
    `Estimated Annual Volume: ${payload.estimatedAnnualVolume || "Not provided"}`,
    `Private Label Required: ${payload.privateLabelRequired || "Not provided"}`,
    `Incoterm Preference: ${payload.incotermPreference || "Not provided"}`,
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
