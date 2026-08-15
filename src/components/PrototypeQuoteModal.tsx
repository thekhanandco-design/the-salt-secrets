"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Turnstile from "@/components/security/Turnstile";
import { loadCmsTextWithStyles } from "@/lib/cms";
import { styleToReact, type CmsTextStyle } from "@/lib/text-style";

const specs: Record<string, [string, string]> = {
  "Pink Salt Chunks": ["Natural crystal", "Coarse / chunk"], "Fine Pink Salt": ["Culinary / ingredient", "Fine"], "Pink Salt Powder": ["Culinary / ingredient", "Fine"],
  "Medium Grain Pink Salt": ["Culinary", "Medium"], "Retail Jar": ["Retail", "Fine / medium / coarse"], "Premium Retail Jar": ["Retail", "Fine / medium / coarse"],
  "Salt Grinder": ["Retail grinder", "Coarse"], "Stand-up Pouch": ["Retail pouch", "Custom"], "Bulk Foodservice": ["Foodservice", "Custom"],
  "Bulk Ingredient Salt": ["Bulk ingredient", "Custom"], "Salt Lifestyle": ["Lifestyle", "Variable"], "Salt Lamp": ["Lifestyle decor", "Natural rock"], "Bath Salt Crystals": ["Lifestyle / bath", "Coarse"],
};

const defaults = {
  kicker: "B2B quote builder", title: "Request a Quote", description: "Complete the commercial details below. Your request will be submitted securely to our B2B team.",
  name: "Full Name", email: "Business Email", company: "Company", phone: "WhatsApp / Phone", country: "Destination Country", product: "Product",
  quantity: "Estimated Quantity", requirements: "Requirements", submit: "Submit Quote Request",
  quickKicker: "Product quick view", quickDescription: "Product specification preview. Publish only verified commercial and technical values.", quickQuote: "Quote this product", quickContinue: "Continue browsing",
};

type Copy = typeof defaults;

export default function PrototypeQuoteModal() {
  const [open, setOpen] = useState(false);
  const [quick, setQuick] = useState(false);
  const [product, setProduct] = useState("Pink Salt / Culinary");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");
  const [copy, setCopy] = useState<Copy>(defaults);
  const [styles, setStyles] = useState<Record<string, CmsTextStyle>>({});
  const onToken = useCallback((value: string) => setToken(value), []);

  useEffect(() => {
    const refresh = () => void loadCopy(localStorage.getItem("salt-language") || "en");
    refresh();
    const quote = (event: Event) => { const detail = (event as CustomEvent<{ product?: string }>).detail; if (detail?.product) setProduct(detail.product); setOpen(true); document.body.classList.add("no-scroll"); };
    const productQuick = (event: Event) => { const detail = (event as CustomEvent<{ product?: string }>).detail; setProduct(detail?.product || "Product"); setQuick(true); document.body.classList.add("no-scroll"); };
    window.addEventListener("tso-open-quote", quote);
    window.addEventListener("tso-product-quick", productQuick);
    window.addEventListener("salt-cms-updated", refresh);
    window.addEventListener("salt-language-change", refresh);
    return () => {
      window.removeEventListener("tso-open-quote", quote); window.removeEventListener("tso-product-quick", productQuick);
      window.removeEventListener("salt-cms-updated", refresh); window.removeEventListener("salt-language-change", refresh);
    };
  }, []);

  async function loadCopy(language: string) {
    const texts = await loadCmsTextWithStyles("global", language);
    const v = (section: string, key: string, fallback: string) => texts[`global.${section}.${key}`]?.value || fallback;
    setCopy({
      kicker: v("prototype_quote", "kicker", defaults.kicker), title: v("prototype_quote", "title", defaults.title), description: v("prototype_quote", "description", defaults.description),
      name: v("prototype_quote", "name", defaults.name), email: v("prototype_quote", "email", defaults.email), company: v("prototype_quote", "company", defaults.company),
      phone: v("prototype_quote", "phone", defaults.phone), country: v("prototype_quote", "country", defaults.country), product: v("prototype_quote", "product", defaults.product),
      quantity: v("prototype_quote", "quantity", defaults.quantity), requirements: v("prototype_quote", "requirements", defaults.requirements), submit: v("prototype_quote", "submit", defaults.submit),
      quickKicker: v("prototype_quick", "kicker", defaults.quickKicker), quickDescription: v("prototype_quick", "description", defaults.quickDescription),
      quickQuote: v("prototype_quick", "quote", defaults.quickQuote), quickContinue: v("prototype_quick", "continue", defaults.quickContinue),
    });
    setStyles(Object.fromEntries(Object.entries(texts).map(([key, item]) => [key, item.style || {}])));
  }

  const s = (section: string, key: string) => styleToReact(styles[`global.${section}.${key}`]);
  const close = () => { setOpen(false); setQuick(false); document.body.classList.remove("no-scroll"); };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setStatus("Sending…");
    const response = await fetch("/api/inquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(form.entries()), product, turnstileToken: token }) });
    const result = await response.json().catch(() => ({}));
    setStatus(response.ok ? "Quote request received. Our B2B team will review it." : (result.error || "Could not submit quote."));
    if (response.ok) formElement.reset();
  }
  const detail = specs[product] || ["Product format", "Custom specification"];

  return <>
    {open ? <div className="modal open" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><div className="modal-card"><div className="modal-head"><div><div className="kicker" style={s("prototype_quote", "kicker")}>{copy.kicker}</div><h2 style={s("prototype_quote", "title")}>{copy.title}</h2><p style={s("prototype_quote", "description")}>{copy.description}</p></div><button className="close" type="button" onClick={close}>×</button></div><form className="form-grid" onSubmit={submit}>
      <div className="field"><label style={s("prototype_quote", "name")}>{copy.name}</label><input name="name" required placeholder="Your name"/></div>
      <div className="field"><label style={s("prototype_quote", "email")}>{copy.email}</label><input name="email" type="email" required placeholder="you@company.com"/></div>
      <div className="field"><label style={s("prototype_quote", "company")}>{copy.company}</label><input name="company" placeholder="Company name"/></div>
      <div className="field"><label style={s("prototype_quote", "phone")}>{copy.phone}</label><input name="whatsapp" required placeholder="+00 000 000000"/></div>
      <div className="field"><label style={s("prototype_quote", "country")}>{copy.country}</label><input name="country" placeholder="Market / country"/></div>
      <div className="field"><label style={s("prototype_quote", "product")}>{copy.product}</label><select value={product} onChange={(event) => setProduct(event.target.value)}><option>Pink Salt / Culinary</option>{Object.keys(specs).map((value) => <option key={value}>{value}</option>)}</select></div>
      <div className="field"><label style={s("prototype_quote", "quantity")}>{copy.quantity}</label><input name="quantity" placeholder="e.g. 5 tons / 10,000 units"/></div>
      <div className="field full"><label style={s("prototype_quote", "requirements")}>{copy.requirements}</label><textarea name="message" required placeholder="Grain size, pack size, label, certification, destination, target price..."/></div>
      <div className="field full"><Turnstile onToken={onToken} action="quote_request"/><button className="btn-primary" type="submit" style={s("prototype_quote", "submit")}>{copy.submit}</button>{status ? <small style={{ display: "block", marginTop: 8 }}>{status}</small> : null}</div>
    </form></div></div> : null}
    {quick ? <div className="modal open" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><div className="modal-card small"><div className="modal-head"><div><div className="kicker" style={s("prototype_quick", "kicker")}>{copy.quickKicker}</div><h2>{product}</h2><p style={s("prototype_quick", "description")}>{copy.quickDescription}</p></div><button className="close" type="button" onClick={close}>×</button></div><div className="spec-grid"><div><b>Format</b><span>{detail[0]}</span></div><div><b>Grain</b><span>{detail[1]}</span></div><div><b>Packaging</b><span>Retail, foodservice or bulk</span></div><div><b>Private Label</b><span>Available for qualified programs</span></div><div><b>Documents</b><span>Specification & COA where applicable</span></div><div><b>Market</b><span>Confirm destination requirements</span></div></div><div className="modal-actions"><button className="btn-primary" type="button" onClick={() => { setQuick(false); setOpen(true); }} style={s("prototype_quick", "quote")}>{copy.quickQuote}</button><button className="btn-secondary" type="button" onClick={close} style={s("prototype_quick", "continue")}>{copy.quickContinue}</button></div></div></div> : null}
  </>;
}
