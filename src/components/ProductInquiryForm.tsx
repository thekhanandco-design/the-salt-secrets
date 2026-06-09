"use client";

import { useState } from "react";

export default function ProductInquiryForm({
  product,
}: {
  product: string;
}) {
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

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product,
          name: formData.get("name"),
          email: formData.get("email"),
          company: formData.get("company"),
          quantity: formData.get("quantity"),
          message: formData.get("message"),
        }),
      });

      if (response.ok) {
        setSuccess(true);

        try {
          form.reset();
        } catch (error) {
          console.error(error);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-[30px] p-10 shadow-lg">
      <h2 className="text-4xl font-bold mb-3">
        Request Product Quotation
      </h2>

      <p className="text-slate-600 mb-8">
        Interested in {product}? Send us your requirements.
      </p>

      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded-xl mb-6">
          Inquiry sent successfully.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid md:grid-cols-2 gap-6"
      >
        <input
          name="name"
          placeholder="Your Name"
          required
          className="border rounded-xl p-4"
        />

        <input
          name="email"
          type="email"
          placeholder="Email Address"
          required
          className="border rounded-xl p-4"
        />

        <input
          name="company"
          placeholder="Company Name"
          className="border rounded-xl p-4"
        />

        <input
          name="quantity"
          placeholder="Required Quantity"
          className="border rounded-xl p-4"
        />

        <textarea
          name="message"
          placeholder="Your Requirements"
          rows={5}
          className="border rounded-xl p-4 md:col-span-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-[#C98A92] text-white py-4 rounded-full font-semibold md:col-span-2 hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Inquiry"}
        </button>
      </form>
    </div>
  );
}