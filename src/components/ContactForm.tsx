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
    <div className="bg-white p-10 rounded-[30px] shadow-lg">
      <h2 className="text-3xl font-bold mb-8">
        Send an Inquiry
      </h2>

      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded-xl mb-6">
          Inquiry sent successfully.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <input
          name="name"
          placeholder="Your Name"
          required
          className="w-full border border-slate-300 rounded-xl p-4"
        />

        <input
          name="email"
          type="email"
          placeholder="Email Address"
          required
          className="w-full border border-slate-300 rounded-xl p-4"
        />

        <input
          name="company"
          placeholder="Company Name"
          className="w-full border border-slate-300 rounded-xl p-4"
        />

        <input
          name="whatsapp"
          placeholder="WhatsApp Number"
          className="w-full border border-slate-300 rounded-xl p-4"
        />

        <input
          name="country"
          placeholder="Country"
          className="w-full border border-slate-300 rounded-xl p-4"
        />

        <textarea
          name="message"
          rows={6}
          placeholder="Tell us about your requirements..."
          className="w-full border border-slate-300 rounded-xl p-4"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-[#C98A92] text-white px-8 py-4 rounded-full font-semibold w-full"
        >
          {loading ? "Sending..." : "Send Inquiry"}
        </button>
      </form>
    </div>
  );
}