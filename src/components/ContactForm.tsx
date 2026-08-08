"use client";

import { useCallback, useState } from "react";
import Turnstile from "@/components/security/Turnstile";
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

const productOptions = [
  "Private Label",
  "PET Bottles",
  "PET Jars",
  "Grinder Bottles",
  "Stand-Up Pouches",
  "Bulk Salt Supply",
];

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const onTurnstile = useCallback((token: string) => setTurnstileToken(token), []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const products = formData.getAll("product").map(String);

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        company: formData.get("company"),
        whatsapp: formData.get("whatsapp"),
        country: formData.get("country"),
        product: products.join(", "),
        quantity: formData.get("quantity"),
        message: formData.get("message"),
        website: formData.get("website"),
        turnstileToken,
      }),
    });

    setLoading(false);
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      setSuccess(true);
      setTurnstileToken("");
      form.reset();
    } else {
      setError(result.error || "Inquiry could not be sent.");
    }
  }

  const inputClass =
    "contact-premium-input h-14 w-full rounded-xl border px-12 text-[#081325] outline-none transition placeholder:text-slate-400";

  return (
    <>
      <div className="mb-7">
        <p className="brand-eyebrow text-left">INQUIRY FORM</p>
        <h2 className="site-heading-font mt-3 text-3xl font-black text-[#07142B]">
          Send Us Your Requirements
        </h2>
      </div>

      {success && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-center font-semibold text-green-700">
          Inquiry sent successfully. Our team will contact you soon.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center font-semibold text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <div className="grid gap-5 md:grid-cols-2">
          <Field icon={<User />}>
            <input name="name" placeholder="Full Name *" required className={inputClass} />
          </Field>
          <Field icon={<Building2 />}>
            <input name="company" placeholder="Company Name" className={inputClass} />
          </Field>
          <Field icon={<Mail />}>
            <input name="email" type="email" placeholder="Email Address *" required className={inputClass} />
          </Field>
          <Field icon={<Phone />}>
            <input name="whatsapp" placeholder="Phone / WhatsApp *" required className={inputClass} />
          </Field>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <input
            name="country"
            placeholder="Country / Market"
            className="contact-premium-input h-14 w-full rounded-xl border px-5 text-[#081325] outline-none transition placeholder:text-slate-400"
          />
          <select
            name="quantity"
            defaultValue=""
            className="contact-premium-input h-14 w-full rounded-xl border px-5 text-[#081325] outline-none transition"
          >
            <option value="" disabled>Estimated Quantity</option>
            <option>6,000 PCS</option>
            <option>10,000 PCS</option>
            <option>25,000 PCS</option>
            <option>50,000 PCS+</option>
            <option>1 Ton+</option>
            <option>5 Tons+</option>
          </select>
        </div>

        <div className="mt-5 rounded-2xl border border-[#EEDCE1] bg-[#FFF9FA] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5 text-[var(--brand-pink)]" />
            <span className="font-black text-[#081325]">Product Interest *</span>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {productOptions.map((product) => (
              <label key={product} className="contact-product-option">
                <input type="checkbox" name="product" value={product} />
                <span>{product}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="relative mt-5">
          <MessageSquare className="absolute left-4 top-5 h-5 w-5 text-slate-400" />
          <textarea
            name="message"
            rows={6}
            placeholder="Tell us about the product, packaging, quantity and destination market *"
            required
            className="contact-premium-input w-full rounded-xl border p-5 pl-12 text-[#081325] outline-none transition placeholder:text-slate-400"
          />
        </div>

        <div className="mt-6 flex justify-center">
          <Turnstile action="contact_form" onToken={onTurnstile} />
        </div>

        <button type="submit" disabled={loading} className="brand-gradient-button mt-6 w-full justify-center disabled:opacity-60">
          <Send className="h-5 w-5" />
          {loading ? "Sending…" : "Send Inquiry"}
        </button>

        <p className="mt-5 flex items-center justify-center gap-2 text-center text-sm text-slate-500">
          <Lock className="h-4 w-4" />
          Your information is kept private and used only to respond to your inquiry.
        </p>
      </form>
    </>
  );
}

function Field({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </span>
      {children}
    </div>
  );
}
