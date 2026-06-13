"use client";

import { useState } from "react";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setSuccess(false);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        company: formData.get("company"),
        whatsapp: formData.get("whatsapp"),
        country: formData.get("country"),
        product: formData.get("product"),
        quantity: formData.get("quantity"),
        message: formData.get("message"),
      }),
    });

    setLoading(false);

    if (response.ok) {
      setSuccess(true);
      form.reset();
    }
  }

  return (
    <>
      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded-xl mb-6 text-center">
          Inquiry sent successfully.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div className="grid md:grid-cols-2 gap-4">
          <input
            name="name"
            placeholder="Full Name"
            required
            className="h-14 px-5 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#C23B4A]"
          />

          <input
            name="company"
            placeholder="Company Name"
            className="h-14 px-5 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#C23B4A]"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            required
            className="h-14 px-5 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#C23B4A]"
          />

          <input
            name="whatsapp"
            placeholder="Phone Number"
            className="h-14 px-5 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#C23B4A]"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <input
            name="country"
            placeholder="Country"
            className="h-14 px-5 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#C23B4A]"
          />

          <select
            name="product"
            className="h-14 px-5 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#C23B4A]"
          >
            <option>Product Interest</option>
            <option>Salt Grinder</option>
            <option>Pink Salt Jar</option>
            <option>Salt Shaker</option>
            <option>Rock Salt Chunks</option>
            <option>Private Label</option>
          </select>

          <select
            name="quantity"
            className="h-14 px-5 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#C23B4A]"
          >
            <option>Quantity Required</option>
            <option>100 KG - 500 KG</option>
            <option>500 KG - 1 Ton</option>
            <option>1 Ton - 5 Tons</option>
            <option>5 Tons+</option>
          </select>
        </div>

        <textarea
          name="message"
          rows={5}
          placeholder="Message"
          className="w-full p-5 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#C23B4A]"
        />

        <div className="text-center pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#C23B4A] text-white px-14 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition"
          >
            {loading ? "Sending..." : "Request Quotation →"}
          </button>
        </div>
      </form>
    </>
  );
}