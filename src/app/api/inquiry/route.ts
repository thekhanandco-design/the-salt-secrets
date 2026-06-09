import { Resend } from "resend";
import { NextResponse } from "next/server";

console.log("RESEND API KEY =", process.env.RESEND_API_KEY);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const {
      product,
      name,
      email,
      company,
      quantity,
      message,
    } = await req.json();

    console.log("NEW INQUIRY:", {
      product,
      name,
      email,
      company,
      quantity,
    });

    const data = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "thekhanandco@gmail.com",
      subject: `🔥 New Product Inquiry - ${product}`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px">
          <h1>🔥 New Product Inquiry</h1>

          <hr />

          <p><strong>Product:</strong> ${product}</p>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Company:</strong> ${company || "Not Provided"}</p>
          <p><strong>Quantity:</strong> ${quantity || "Not Provided"}</p>

          <hr />

          <h3>Message</h3>

          <p>${message || "No message provided"}</p>
        </div>
      `,
    });

    console.log("EMAIL SENT:", data);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("RESEND ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}