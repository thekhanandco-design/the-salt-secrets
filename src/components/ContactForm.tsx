"use client";

import { useState } from "react";
import {
  Building2,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Tag,
  User,
} from "lucide-react";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

  const inputClass =
    "h-14 w-full rounded-md border border-[#F1C8CF] bg-white px-12 text-[#081325] outline-none transition placeholder:text-slate-500 focus:border-[#C23B4A]";

  return (
    <>
      {success && (
        <div className="mb-6 rounded-md bg-green-100 p-4 text-center font-semibold text-green-700">
          Inquiry sent successfully.
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-[1200px] mx-auto">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              name="name"
              placeholder="Full Name *"
              required
              className={inputClass}
            />
          </div>

          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              name="company"
              placeholder="Company Name"
              className={inputClass}
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              name="email"
              type="email"
              placeholder="Email Address *"
              required
              className={inputClass}
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              name="whatsapp"
              placeholder="Phone / WhatsApp *"
              required
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mt-5">
          <div className="relative">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select name="product" className={inputClass}>
              <option>Product Interest *</option>
              <option>Private Label</option>
              <option>PET Bottles</option>
              <option>PET Jars</option>
              <option>Grinder Bottles</option>
              <option>Stand-Up Pouches</option>
              <option>Bulk Salt Supply</option>
            </select>
          </div>

          <input
            name="country"
            placeholder="Country"
            className="h-14 w-full rounded-md border border-[#F1C8CF] bg-white px-5 text-[#081325] outline-none transition placeholder:text-slate-500 focus:border-[#C23B4A]"
          />

          <select
            name="quantity"
            className="h-14 w-full rounded-md border border-[#F1C8CF] bg-white px-5 text-[#081325] outline-none transition focus:border-[#C23B4A]"
          >
            <option>Estimated Quantity</option>
            <option>6000 PCS</option>
            <option>10,000 PCS</option>
            <option>25,000 PCS</option>
            <option>50,000 PCS+</option>
            <option>1 Ton+</option>
            <option>5 Tons+</option>
          </select>
        </div>

        <div className="relative mt-5">
          <MessageSquare className="absolute left-4 top-5 w-5 h-5 text-slate-400" />
          <textarea
            name="message"
            rows={6}
            placeholder="Your Message *"
            required
            className="w-full rounded-md border border-[#F1C8CF] bg-white p-5 pl-12 text-[#081325] outline-none transition placeholder:text-slate-500 focus:border-[#C23B4A]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-md bg-[#C23B4A] px-8 py-4 font-black text-white shadow-[0_15px_35px_rgba(194,59,74,0.22)] transition hover:opacity-90 disabled:opacity-60"
        >
          <Send className="w-5 h-5" />
          {loading ? "Sending..." : "Send Inquiry"}
        </button>

        <p className="mt-5 flex items-center justify-center gap-2 text-center text-sm text-slate-500">
          <Lock className="w-4 h-4" />
          Your information is safe with us. We never share your details.
        </p>
      </form>
    </>
  );
}