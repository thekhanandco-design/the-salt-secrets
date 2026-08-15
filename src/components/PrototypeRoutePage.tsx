"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { loadCmsTextWithStyles, type CmsTextPayload } from "@/lib/cms";
import { styleToReact } from "@/lib/text-style";
import { prototypePageMarkup } from "@/lib/prototype-content";
import { supabase } from "@/lib/supabase-client";
import Turnstile from "@/components/security/Turnstile";

type PublicPage = "home" | "products" | "private-label" | "certifications" | "blog" | "about" | "faqs" | "contact";
type BlogPost = { id: number; title: string; slug: string; excerpt?: string | null; featured_image?: string | null; published_at?: string | null; created_at?: string | null; content_type?: string | null };
type Faq = { id: number; question: string; answer: string; category?: string | null };

const pageRoute: Record<string, string> = { home: "/", products: "/products", "private-label": "/private-label", certifications: "/certifications", blog: "/blog", about: "/about", faq: "/faqs", faqs: "/faqs", contact: "/contact" };

const fallbackFaqs: Faq[] = [
  { id: -1, question: "Which pink salt formats can be offered?", answer: "Fine, medium, coarse, chunks, retail jars, grinders, pouches, bulk and lifestyle formats can be structured around your market and commercial requirements." },
  { id: -2, question: "Can I request a custom grain size?", answer: "Yes. Share the target grain range or end-use application and the sales team can confirm the appropriate specification." },
  { id: -3, question: "Do you support private-label packaging?", answer: "Private-label programs can be developed around pouches, jars, grinders and bulk formats, including pack size, artwork and market requirements." },
  { id: -4, question: "Can I request certificates and lab reports?", answer: "Verified product and compliance documents can be supplied for qualified commercial reviews where applicable." },
  { id: -5, question: "Can buyers request samples online?", answer: "Yes. Use the B2B inquiry flow to identify the product, packaging direction and destination for a sample request." },
];
const fallbackBlogs: BlogPost[] = [
  { id: -1, slug: "", title: "Choosing the right pink salt grain size for your market", excerpt: "A practical breakdown of fine, medium, coarse and chunk formats — and where each works best." },
  { id: -2, slug: "", title: "What importers should prepare before custom packaging", excerpt: "Brand files, pack size, target market and expected volume." },
  { id: -3, slug: "", title: "What a professional salt specification sheet should include", excerpt: "Particle size, packaging, testing and commercial identifiers." },
];

function applyStyle(element: HTMLElement, style: Record<string, string | undefined>) {
  const map: Record<string, keyof CSSStyleDeclaration> = {
    fontFamily: "fontFamily", fontSize: "fontSize", fontWeight: "fontWeight", color: "color", backgroundColor: "backgroundColor",
    textTransform: "textTransform", fontStyle: "fontStyle", textDecoration: "textDecoration", textAlign: "textAlign", letterSpacing: "letterSpacing", lineHeight: "lineHeight",
  };
  Object.entries(style || {}).forEach(([key, value]) => {
    if (!value || value === "inherit" || value === "auto") return;
    const cssKey = map[key];
    if (cssKey) (element.style as unknown as Record<string, string>)[cssKey as string] = value;
  });
}

function DynamicBlogGrid({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  useEffect(() => { void (async () => {
    const { data } = await supabase.from("blog_posts").select("id,title,slug,excerpt,featured_image,published_at,created_at,content_type").eq("status", "published").eq("content_type", "blog").order("published_at", { ascending: false }).limit(compact ? 3 : 12);
    setPosts((data as BlogPost[]) || []);
  })(); }, [compact]);
  const rows = posts.length ? posts : fallbackBlogs;
  return <>{rows.map((post, index) => (
    <article className={`article-card${index === 0 && !compact ? " featured" : ""}`} key={`${post.id}-${post.title}`}>
      <div className="article-art" style={post.featured_image ? { backgroundImage: `url(${post.featured_image})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
      <div className="article-body"><small>{index === 0 ? "Buyer Guide · Featured" : index === 1 ? "Private Label" : "Specifications"}</small><h3>{post.title}</h3><p>{post.excerpt || "Commercial guidance for international salt buyers."}</p><button className="text-link" type="button" onClick={() => post.slug ? router.push(`/blog/${post.slug}`) : router.push("/blog")}>Read article →</button></div>
    </article>
  ))}</>;
}

function DynamicFaqList({ home = false }: { home?: boolean }) {
  const [items, setItems] = useState<Faq[]>([]);
  useEffect(() => { void (async () => {
    const { data } = await supabase.from("cms_faqs").select("id,question,answer,category").eq("status", "published").order("display_order").limit(home ? 3 : 40);
    setItems((data as Faq[]) || []);
  })(); }, [home]);
  const rows = items.length ? items : fallbackFaqs.slice(0, home ? 3 : fallbackFaqs.length);
  return <>{rows.map((item, index) => <div className={`faq-item${index === 0 ? " open" : ""}`} key={item.id}><button className="faq-q" type="button"><span>{item.question}</span><span>+</span></button><div className="faq-a"><div>{item.category ? <small>{item.category}</small> : null}<p>{item.answer}</p></div></div></div>)}</>;
}

function NewsletterForm() {
  const [email, setEmail] = useState(""); const [token, setToken] = useState(""); const [status, setStatus] = useState(""); const [copy,setCopy]=useState<Record<string,CmsTextPayload>>({});
  const onToken = useCallback((value: string) => setToken(value), []);
  useEffect(()=>{void loadCmsTextWithStyles("blog",localStorage.getItem("salt-language")||"en").then(setCopy)},[]);
  async function submit(event: FormEvent) { event.preventDefault(); setStatus("Subscribing…"); const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, language: localStorage.getItem("salt-language") || "en", turnstileToken: token }) }); const result = await response.json().catch(() => ({})); setStatus(response.ok ? "Subscribed." : (result.error || "Could not subscribe.")); if (response.ok) setEmail(""); }
  const placeholder=copy["blog.listing.newsletter_placeholder"]; const button=copy["blog.listing.newsletter_button"];
  return <form onSubmit={submit}><input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder={placeholder?.value||"Business email"} style={styleToReact(placeholder?.style)} /><button className="btn-primary" type="submit" style={styleToReact(button?.style)}>{button?.value||"Subscribe"}</button><div style={{ width: "100%" }}><Turnstile onToken={onToken} action="newsletter_subscribe" /></div>{status ? <small>{status}</small> : null}</form>;
}

function ContactFormExact() {
  const [token, setToken] = useState(""); const [status, setStatus] = useState(""); const [copy,setCopy]=useState<Record<string,CmsTextPayload>>({}); const onToken = useCallback((v:string)=>setToken(v),[]);
  useEffect(()=>{void loadCmsTextWithStyles("contact",localStorage.getItem("salt-language")||"en").then(setCopy)},[]);
  const c=(key:string,fallback:string)=>copy[`contact.contact.${key}`]?.value||fallback; const cs=(key:string)=>styleToReact(copy[`contact.contact.${key}`]?.style);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const formElement=event.currentTarget; const form = new FormData(formElement); setStatus("Sending…"); const payload = Object.fromEntries(form.entries()); const response = await fetch("/api/contact", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ ...payload, turnstileToken: token }) }); const result=await response.json().catch(()=>({})); setStatus(response.ok?"Thank you. Your inquiry has been received.":(result.error||"Could not send inquiry.")); if(response.ok) formElement.reset(); }
  return <form className="form-grid" onSubmit={submit}><div className="field"><label style={cs("form_name_label")}>{c("form_name_label","Full Name")}</label><input name="name" required placeholder="Your name" /></div><div className="field"><label style={cs("form_email_label")}>{c("form_email_label","Business Email")}</label><input name="email" required type="email" placeholder="you@company.com" /></div><div className="field"><label style={cs("form_company_label")}>{c("form_company_label","Company")}</label><input name="company" placeholder="Company name" /></div><div className="field"><label style={cs("form_whatsapp_label")}>{c("form_whatsapp_label","WhatsApp / Phone")}</label><input name="whatsapp" required placeholder="+00 000 000000" /></div><div className="field"><label style={cs("form_country_label")}>{c("form_country_label","Country")}</label><input name="country" placeholder="Destination market" /></div><div className="field"><label style={cs("form_inquiry_label")}>{c("form_inquiry_label","Inquiry Type")}</label><select name="product"><option>Product Inquiry</option><option>Private Label</option><option>Bulk Supply</option><option>Samples</option><option>Documents</option></select></div><div className="field"><label style={cs("form_volume_label")}>{c("form_volume_label","Estimated Volume")}</label><input name="quantity" placeholder="e.g. 5 tons / 10,000 units" /></div><div className="field" aria-hidden="true" style={{ position:"absolute", left:"-9999px" }}><input name="website" tabIndex={-1} autoComplete="off" /></div><div className="field full"><label style={cs("form_message_label")}>{c("form_message_label","Message")}</label><textarea name="message" required placeholder="Product, grain size, packaging, destination and target timing…" /></div><div className="field full"><Turnstile onToken={onToken} action="contact_form" /><button className="btn-primary" type="submit" style={cs("form_button")}>{c("form_button","Send Inquiry")}</button>{status ? <small style={{ display:"block", marginTop:8 }}>{status}</small> : null}</div></form>;
}

export default function PrototypeRoutePage({ page }: { page: PublicPage }) {
  const host = useRef<HTMLDivElement>(null); const router = useRouter(); const [slots, setSlots] = useState<Record<string, Element>>({});
  const markup = useMemo(() => prototypePageMarkup[page] || "", [page]);

  useEffect(() => {
    const root = host.current; if (!root) return;
    setSlots({});
    const originalInlineStyles = new Map<HTMLElement, string | null>();
    root.querySelectorAll<HTMLElement>("[data-cms-key]").forEach((el) => originalInlineStyles.set(el, el.getAttribute("style")));
    const refreshText = async () => { const language = localStorage.getItem("salt-language") || "en"; const payload = await loadCmsTextWithStyles(page, language); root.querySelectorAll<HTMLElement>("[data-cms-key]").forEach((el) => { const key=el.dataset.cmsKey||""; const item=payload[key]; if(!item) return; const originalStyle=originalInlineStyles.get(el); if(originalStyle===null||originalStyle===undefined) el.removeAttribute("style"); else el.setAttribute("style",originalStyle); el.textContent=item.value; applyStyle(el, item.style as unknown as Record<string,string|undefined>); }); };
    void refreshText();
    const refresh = () => void refreshText(); window.addEventListener("salt-cms-updated", refresh); window.addEventListener("salt-language-change", refresh);

    root.querySelectorAll<HTMLElement>("[data-react-slot]").forEach((el)=>{ const key=el.dataset.reactSlot; if(key) setSlots((old)=>({ ...old, [key]:el })); });
    const grainField=root.querySelector<HTMLElement>("#grainField"); if(grainField && !grainField.childElementCount){ for(let i=0;i<110;i++){ const g=document.createElement("i"); g.className="grain"; const x=(i*37)%91, y=(i*53)%47, rot=(i*29)%180, scale=.55+((i*17)%100)/100; g.style.left=`${4+x}%`;g.style.top=`${42+y}%`;g.style.transform=`rotate(${rot}deg) scale(${scale})`;g.style.opacity=String(.42+((i*13)%55)/100);grainField.appendChild(g);} }
    const observer=new IntersectionObserver((entries)=>entries.forEach((entry)=>{ if(entry.isIntersecting){(entry.target as HTMLElement).classList.add("visible");observer.unobserve(entry.target);}}),{threshold:.06}); root.querySelectorAll(".reveal").forEach((el)=>observer.observe(el));
    const click=(event:Event)=>{ const target=event.target as HTMLElement; const nav=target.closest<HTMLElement>(".nav-link[data-page]"); if(nav){ event.preventDefault(); router.push(pageRoute[nav.dataset.page||""]||"/"); return; } const faq=target.closest<HTMLElement>(".faq-q"); if(faq){ faq.closest(".faq-item")?.classList.toggle("open"); return; } const quote=target.closest(".open-quote"); if(quote){ event.preventDefault(); window.dispatchEvent(new CustomEvent("tso-open-quote", { detail:{ product:(quote as HTMLElement).dataset.product||"" } })); return; } const quick=target.closest<HTMLElement>(".product-quick"); if(quick){ event.preventDefault(); window.dispatchEvent(new CustomEvent("tso-product-quick", {detail:{product:quick.dataset.product||"Product"}})); return; } const tab=target.closest<HTMLElement>("#productTabs .tab"); if(tab){ root.querySelectorAll("#productTabs .tab").forEach((n)=>n.classList.toggle("active",n===tab)); const filter=tab.dataset.filter||"all"; root.querySelectorAll<HTMLElement>("#fullProductGrid .product-card").forEach((card)=>card.classList.toggle("hide",filter!=="all"&&card.dataset.category!==filter)); return; } const pack=target.closest<HTMLElement>(".pack-option"); if(pack){ const controls=pack.closest<HTMLElement>(".pack-controls"); const targetName=controls?.dataset.target; const packName=pack.dataset.pack||"pouch"; const mock=root.querySelector<HTMLElement>(targetName==="pl"?"#plMockPack":"#homeMockPack"); const sku=root.querySelector<HTMLElement>(targetName==="pl"?"#plMockSku":"#homeMockSku"); if(mock) mock.className=`mock-pack${packName==="pouch"?"":` ${packName}`}`; if(sku) sku.textContent=({pouch:"Stand-up pouch · retail",jar:"Premium jar · retail",grinder:"Grinder bottle · retail",bulk:"Bulk pack · foodservice / ingredient"} as Record<string,string>)[packName]||""; controls?.querySelectorAll(".pack-option").forEach((n)=>n.classList.toggle("active",n===pack)); } };
    root.addEventListener("click",click);
    return()=>{ root.removeEventListener("click",click); observer.disconnect(); window.removeEventListener("salt-cms-updated",refresh);window.removeEventListener("salt-language-change",refresh); };
  }, [page, markup, router]);

  return <>
    <main ref={host} className="prototype-route-page" dangerouslySetInnerHTML={{__html:markup}} />
    {slots["home-blog-grid"] ? createPortal(<DynamicBlogGrid compact />, slots["home-blog-grid"]) : null}
    {slots["blog-grid"] ? createPortal(<DynamicBlogGrid />, slots["blog-grid"]) : null}
    {slots["home-faq-list"] ? createPortal(<DynamicFaqList home />, slots["home-faq-list"]) : null}
    {slots["faq-list"] ? createPortal(<DynamicFaqList />, slots["faq-list"]) : null}
    {slots["newsletter-form"] ? createPortal(<NewsletterForm />, slots["newsletter-form"]) : null}
    {slots["contact-form"] ? createPortal(<ContactFormExact />, slots["contact-form"]) : null}
  </>;
}
