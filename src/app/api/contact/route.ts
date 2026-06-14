import { Resend } from "resend";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const {
      name,
      email,
      company,
      whatsapp,
      country,
      product,
      quantity,
      message,
    } = await req.json();

    await supabase.from("inquiries").insert({
      name,
      email,
      company,
      whatsapp,
      country,
      product,
      quantity,
      message,
    });

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "thekhanandco@gmail.com",
      subject: `🚨 NEW CONTACT LEAD | ${name}`,

      html: `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">

        <div style="background:#C98A92;padding:24px">
          <h1 style="margin:0;color:white;">
            🚨 New Contact Inquiry
          </h1>
        </div>

        <div style="padding:30px">

          <table style="width:100%;border-collapse:collapse">

            <tr>
              <td style="padding:12px;border-bottom:1px solid #eee;"><strong>Name</strong></td>
              <td style="padding:12px;border-bottom:1px solid #eee;">${name}</td>
            </tr>

            <tr>
              <td style="padding:12px;border-bottom:1px solid #eee;"><strong>Email</strong></td>
              <td style="padding:12px;border-bottom:1px solid #eee;">${email}</td>
            </tr>

            <tr>
              <td style="padding:12px;border-bottom:1px solid #eee;"><strong>Company</strong></td>
              <td style="padding:12px;border-bottom:1px solid #eee;">${company || "Not Provided"}</td>
            </tr>

            <tr>
              <td style="padding:12px;border-bottom:1px solid #eee;"><strong>WhatsApp</strong></td>
              <td style="padding:12px;border-bottom:1px solid #eee;">${whatsapp || "Not Provided"}</td>
            </tr>

            <tr>
              <td style="padding:12px;border-bottom:1px solid #eee;"><strong>Country</strong></td>
              <td style="padding:12px;border-bottom:1px solid #eee;">${country || "Not Provided"}</td>
            </tr>

            <tr>
              <td style="padding:12px;border-bottom:1px solid #eee;"><strong>Product</strong></td>
              <td style="padding:12px;border-bottom:1px solid #eee;">${product || "Not Provided"}</td>
            </tr>

            <tr>
              <td style="padding:12px;border-bottom:1px solid #eee;"><strong>Quantity</strong></td>
              <td style="padding:12px;border-bottom:1px solid #eee;">${quantity || "Not Provided"}</td>
            </tr>

          </table>

          <h2 style="margin-top:30px;">Customer Message</h2>

          <div style="background:#f8fafc;border:1px solid #e5e7eb;padding:20px;border-radius:10px;margin-top:10px;">
            ${message || "No message provided"}
          </div>

        </div>

      </div>
      `,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}