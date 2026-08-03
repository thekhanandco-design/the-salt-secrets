"use client";

import { useCallback, useState } from "react";
import Turnstile from "@/components/security/Turnstile";

export default function ProductInquiryForm({
  product,
}: {
  product: string;
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const onTurnstile = useCallback((token: string) => setTurnstileToken(token), []);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setSuccess(false);
    setError("");

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
          website: formData.get("website"),
          turnstileToken,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        setSuccess(true);

        try {
          form.reset();
          setTurnstileToken("");
        } catch (error) {
          console.error(error);
        }
      } else {
        setError(result.error || "Inquiry could not be sent.");
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

      {error && <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6">{error}</div>}

      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded-xl mb-6">
          Inquiry sent successfully.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid md:grid-cols-2 gap-6"
      >
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
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

        <div className="md:col-span-2 flex justify-center"><Turnstile action="product_inquiry" onToken={onTurnstile} /></div>

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