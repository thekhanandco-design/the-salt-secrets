"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, Moon, Sun } from "lucide-react";
import { loadCmsImages, loadCmsText, type CmsLanguage } from "@/lib/cms";
import { supabase } from "@/lib/supabase-client";
import { useSiteTheme } from "@/components/SiteThemeProvider";

const defaults = { home:"Home", about:"About Us", products:"Products", private_label:"Private Label", certifications:"Certifications", blog:"Blog", contact:"Contact", quote:"Get Quote" };

export default function Navbar() {
  const { dark, toggle } = useSiteTheme();
  const [isOpen,setIsOpen]=useState(false);
  const [language,setLanguage]=useState("en");
  const [languages,setLanguages]=useState<CmsLanguage[]>([]);
  const [labels,setLabels]=useState(defaults);
  const [logo,setLogo]=useState("/logo.png");

  useEffect(()=>{
    const saved=localStorage.getItem("salt-language")||"en";
    setLanguage(saved);
    document.documentElement.lang=saved;
    document.documentElement.dir="ltr";
    document.documentElement.dataset.siteLanguage=saved;
    load(saved);
  },[]);

  async function load(lang:string){
    const [{data:langs},texts,images]=await Promise.all([
      supabase.from("cms_languages").select("*").eq("enabled",true).order("display_order"),
      loadCmsText("global",lang),
      loadCmsImages("global")
    ]);
    setLanguages((langs as CmsLanguage[])||[]);
    setLabels({
      home:texts["global.navbar.home"]||defaults.home,
      about:texts["global.navbar.about"]||defaults.about,
      products:texts["global.navbar.products"]||defaults.products,
      private_label:texts["global.navbar.private_label"]||defaults.private_label,
      certifications:texts["global.navbar.certifications"]||defaults.certifications,
      blog:texts["global.navbar.blog"]||defaults.blog,
      contact:texts["global.navbar.contact"]||defaults.contact,
      quote:texts["global.navbar.quote"]||defaults.quote,
    });
    setLogo(images["global.branding.logo"]?.url||"/logo.png");
  }

  function changeLanguage(code:string){
    setLanguage(code); localStorage.setItem("salt-language",code); load(code);
    window.dispatchEvent(new CustomEvent("salt-language-change",{detail:code}));
    document.documentElement.dir="ltr";
    document.documentElement.lang=code;
    document.documentElement.dataset.siteLanguage=code;
  }

  const links=[
    ["/",labels.home],["/about",labels.about],["/products",labels.products],["/private-label",labels.private_label],["/certifications",labels.certifications],["/blog",labels.blog],["/contact",labels.contact]
  ];

  return <>
    <header className="sticky top-0 z-[999] bg-white border-b border-[#F1E2E5] shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
      <div className="max-w-[1700px] mx-auto px-6 lg:px-16 h-[84px] flex items-center justify-between">
        <Link href="/" className="flex items-center"><img src={logo} alt="The Salt Origin" className="h-[55px] lg:h-[62px] w-auto object-contain"/></Link>
        <nav className="hidden lg:flex items-center gap-8 text-[15px] font-semibold text-[#111827]">{links.map(([href,label])=><Link key={href} href={href} className="hover:text-[#C54B5B] transition">{label}</Link>)}</nav>
        <div className="flex items-center gap-3">
          <button onClick={toggle} aria-label="Toggle website theme" className="hidden md:inline-flex items-center justify-center w-11 h-11 rounded-xl border border-[#EFE3E5] bg-white text-[#081325] site-theme-button">{dark ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}</button>
          <div className="hidden md:flex relative items-center"><select aria-label="Website language" value={language} onChange={e=>changeLanguage(e.target.value)} className="appearance-none border border-[#EFE3E5] rounded-xl pl-4 pr-9 py-3 text-sm font-bold bg-white text-[#081325]">{languages.length?languages.map(l=><option key={l.code} value={l.code}>{l.native_name}</option>):<option value="en">English</option>}</select><ChevronDown className="absolute right-3 w-4 h-4 pointer-events-none text-slate-500"/></div>
          <Link href="/contact" className="hidden md:flex items-center justify-center bg-[#C54B5B] text-white px-7 py-3 rounded-xl font-bold hover:opacity-90 transition">{labels.quote}</Link>
          <button onClick={()=>setIsOpen(true)} className="lg:hidden p-2" aria-label="Open menu"><Menu className="w-7 h-7"/></button>
        </div>
      </div>
    </header>
    {isOpen&&<><button className="fixed inset-0 bg-black/50 z-[990]" onClick={()=>setIsOpen(false)} aria-label="Close menu overlay"/><aside className="fixed top-0 right-0 h-screen w-[84%] max-w-[380px] bg-white z-[1000] shadow-2xl p-6"><div className="flex justify-between items-center"><img src={logo} alt="The Salt Origin" className="h-14 w-auto"/><button onClick={()=>setIsOpen(false)}><X className="w-7 h-7"/></button></div><div className="mt-8"><select value={language} onChange={e=>changeLanguage(e.target.value)} className="w-full border rounded-xl p-4 bg-white">{languages.map(l=><option key={l.code} value={l.code}>{l.native_name}</option>)}</select></div><nav className="mt-5 flex flex-col gap-2">{links.map(([href,label])=><Link key={href} href={href} onClick={()=>setIsOpen(false)} className="px-4 py-3 rounded-xl hover:bg-[#FFF4F5] font-bold">{label}</Link>)}<Link href="/contact" onClick={()=>setIsOpen(false)} className="mt-3 bg-[#C54B5B] text-white text-center py-4 rounded-xl font-bold">{labels.quote}</Link></nav></aside></>}
  </>;
}
