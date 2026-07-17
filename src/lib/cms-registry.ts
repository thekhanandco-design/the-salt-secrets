export type CmsImageSlotSeed = {
  page_slug: string;
  section_slug: string;
  slot_key: string;
  title: string;
  current_url: string;
  default_url: string;
  alt_text: string;
  recommended_width: number;
  recommended_height: number;
  display_order: number;
  is_active: boolean;
};

export type CmsTextSeed = {
  page_slug: string;
  section_slug: string;
  field_key: string;
  field_label: string;
  field_type: "text" | "textarea";
  default_value: string;
  display_order: number;
};

export const cmsPageLabels: Record<string, string> = {
  global: "Branding / Footer",
  home: "Homepage",
  about: "About Page",
  products: "Products Page",
  "private-label": "Private Label",
  certifications: "Certifications",
  contact: "Contact Page",
  blog: "Blog Page",
};

export const cmsImageRegistry: CmsImageSlotSeed[] = [
  ["global","branding","logo","Site Logo — Header & Footer","/logo.png","The Salt Origin logo",400,220],
  ["home","hero","products","Hero Section — Product Collection","/hero-products.png","Himalayan Pink Salt product collection",900,900],
  ["home","hero","mountains","Hero Section — Mountain Background","/mountains-bg.png","Himalayan mountain background",1920,900],
  ["home","private_label","custom_labels","Private Label — Custom Bottles","/custom-labels.png","Custom bottles",600,400],
  ["home","private_label","custom_packaging","Private Label — Custom Packaging","/custom-packaging.png","Custom packaging",600,400],
  ["home","products","pet_bottles","Product Range — PET Bottles","/pet-bottles.png","PET salt bottles",600,600],
  ["home","products","pet_jars","Product Range — PET Jars","/pet-jars.png","PET salt jars",600,600],
  ["home","products","grinders","Product Range — Grinder Collection","/grinder-bottles.png","Salt grinder bottles",600,600],
  ["home","products","pouches","Product Range — Stand-Up Pouch","/standup-pouch.png","Stand-up salt pouch",600,600],
  ["home","quality","iso","Quality — ISO Certificate","/cert-iso.png","ISO certificate",400,400],
  ["home","quality","haccp","Quality — HACCP Certificate","/cert-haccp.png","HACCP certificate",400,400],
  ["home","quality","gmp","Quality — GMP Certificate","/cert-gmp.png","GMP certificate",400,400],
  ["home","quality","halal","Quality — Halal Certificate","/cert-halal.png","Halal certificate",400,400],
  ["home","quality","fda","Quality — FDA Certificate","/cert-fda.png","FDA registration",400,400],
  ["home","quality","food","Quality — Food Certificate","/cert-food.png","Food certificate",400,400],
  ["home","export","map","Export Markets — World Map","/world-map.png","World export map",1400,700],
  ["about","hero","banner","About Page — Hero Banner","/hero-banner.png","About The Salt Origin",1600,900],
  ["about","story","collage","About Page — Product Collage","/product-collage.png","Salt product collage",1200,800],
  ["products","retail","shaker","Products — Salt Shaker","/shaker-bottles.png","Salt shaker collection",800,800],
  ["products","retail","jar","Products — Salt Jar","/pet-jars.png","Salt jar collection",800,800],
  ["products","retail","pouch","Products — Stand-Up Pouch","/pouches.png","Stand-up pouch collection",800,800],
  ["products","grinder","plastic","Products — Plastic Grinder","/grinder-bottles.png","Plastic grinder bottles",800,800],
  ["products","grinder","ceramic","Products — Ceramic Grinder","/ceramic-grinders.png","Ceramic grinder bottles",800,800],
  ["products","bulk","bag","Products — Bulk Salt Bag","/white-sack.png","Bulk salt bag",800,800],
  ["private-label","hero","main","Private Label — Hero Image","/custom-logo-design.png","Private label salt branding",1200,900],
  ["private-label","process","labels","Private Label — Labels","/custom-labels.png","Custom labels",800,600],
  ["private-label","process","packaging","Private Label — Packaging","/custom-packaging.png","Custom packaging",800,600],
  ["certifications","cards","iso","Certifications Page — ISO","/cert-iso.png","ISO certification",500,500],
  ["certifications","cards","haccp","Certifications Page — HACCP","/cert-haccp.png","HACCP certification",500,500],
  ["certifications","cards","gmp","Certifications Page — GMP","/cert-gmp.png","GMP certification",500,500],
  ["certifications","cards","halal","Certifications Page — Halal","/cert-halal.png","Halal certification",500,500],
  ["certifications","cards","fda","Certifications Page — FDA","/cert-fda.png","FDA registration",500,500],
  ["contact","hero","banner","Contact Page — Hero Image","/hero-banner.png","Contact The Salt Origin",1600,900],
  ["blog","listing","default","Blog — Default Featured Image","/og-image.jpg","Himalayan Pink Salt blog",1200,630],
].map((row, index) => {
  const [page_slug, section_slug, slot_key, title, url, alt_text, recommended_width, recommended_height] = row as [string,string,string,string,string,string,number,number];
  return { page_slug, section_slug, slot_key, title, current_url: url, default_url: url, alt_text, recommended_width, recommended_height, display_order: index + 1, is_active: true };
});

export const cmsTextRegistry: CmsTextSeed[] = [
  ["global","navbar","home","Home Menu Label","text","Home"],
  ["global","navbar","about","About Menu Label","text","About Us"],
  ["global","navbar","products","Products Menu Label","text","Products"],
  ["global","navbar","private_label","Private Label Menu Label","text","Private Label"],
  ["global","navbar","certifications","Certifications Menu Label","text","Certifications"],
  ["global","navbar","blog","Blog Menu Label","text","Blog"],
  ["global","navbar","contact","Contact Menu Label","text","Contact"],
  ["global","navbar","quote","Quote Button Label","text","Get Quote"],
  ["home","hero","badge","Hero Badge","text","PREMIUM QUALITY"],
  ["home","hero","title","Hero Main Heading","textarea","Himalayan Pink Salt Solutions For Global Markets"],
  ["home","hero","description","Hero Description","textarea","We provide premium quality Himalayan Pink Salt in multiple forms and packaging, trusted by importers, distributors and brands worldwide."],
  ["home","hero","primary_button","Explore Products Button","text","Explore Products"],
  ["home","hero","secondary_button","Request Quote Button","text","Request Quote"],
  ["home","private_label","title","Private Label Heading","text","PRIVATE LABEL SOLUTIONS"],
  ["home","private_label","description","Private Label Description","textarea","We help brands create their identity with fully customized bottles and packaging."],
  ["home","private_label","bullet_bottles","Private Label Bullet — Bottles","text","Custom Bottles"],
  ["home","private_label","bullet_packaging","Private Label Bullet — Packaging","text","Custom Packaging"],
  ["home","private_label","button","Private Label Button","text","Learn More"],
  ["home","private_label","bottles_title","Custom Bottles Card Heading","text","Custom Bottles"],
  ["home","private_label","bottles_text","Custom Bottles Card Description","textarea","Choose your bottle style, size and design to match your brand identity."],
  ["home","private_label","packaging_title","Custom Packaging Card Heading","text","Custom Packaging"],
  ["home","private_label","packaging_text","Custom Packaging Card Description","textarea","Custom printed pouches and jars with your logo, colors and design."],
  ["home","products","title","Product Range Heading","text","OUR PRODUCT RANGE"],
  ["home","products","description","Product Range Description","textarea","Premium Himalayan Pink Salt products for retail, private label and global distribution."],
  ["home","products","pet_bottles_title","PET Bottles Card Heading","text","PET Bottles"],
  ["home","products","pet_bottles_text","PET Bottles Card Description","textarea","Multiple sizes for everyday use and retail."],
  ["home","products","pet_jars_title","PET Jars Card Heading","text","PET Jars"],
  ["home","products","pet_jars_text","PET Jars Card Description","textarea","Fine grain salt in convenient PET jars."],
  ["home","products","grinders_title","Grinder Card Heading","text","Grinder Collection"],
  ["home","products","grinders_text","Grinder Card Description","textarea","Plastic and ceramic grinder bottles."],
  ["home","products","pouches_title","Pouches Card Heading","text","Stand-Up Pouches"],
  ["home","products","pouches_text","Pouches Card Description","textarea","Premium zip-lock pouches for maximum freshness."],
  ["home","products","view_button","Product Card Button","text","View Products"],
  ["home","why_choose","title","Why Choose Us Heading","text","WHY CHOOSE US"],
  ["home","why_choose","description","Why Choose Us Description","textarea","Reliable supply, flexible MOQ, custom packaging, export support and premium quality."],
  ["home","why_choose","item_1_title","Why Choose Item 1 Heading","text","Reliable Supply"],
  ["home","why_choose","item_1_text","Why Choose Item 1 Description","textarea","Consistent production and dependable supply for international buyers."],
  ["home","why_choose","item_2_title","Why Choose Item 2 Heading","text","Flexible MOQ"],
  ["home","why_choose","item_2_text","Why Choose Item 2 Description","textarea","Order quantities designed for growing brands and established importers."],
  ["home","why_choose","item_3_title","Why Choose Item 3 Heading","text","Custom Packaging"],
  ["home","why_choose","item_3_text","Why Choose Item 3 Description","textarea","Retail-ready packaging customized for your market and brand."],
  ["home","why_choose","item_4_title","Why Choose Item 4 Heading","text","Export Support"],
  ["home","why_choose","item_4_text","Why Choose Item 4 Description","textarea","Documentation and shipment support for worldwide trade."],
  ["home","why_choose","item_5_title","Why Choose Item 5 Heading","text","Quality Focused"],
  ["home","why_choose","item_5_text","Why Choose Item 5 Description","textarea","Food-grade Himalayan Pink Salt with strict quality control."],
  ["home","why_choose","item_6_title","Why Choose Item 6 Heading","text","Global Reach"],
  ["home","why_choose","item_6_text","Why Choose Item 6 Description","textarea","Serving distributors, wholesalers and private-label buyers worldwide."],
  ["home","quality","title","Quality Standards Heading","text","OUR QUALITY STANDARDS"],
  ["home","quality","description","Quality Standards Description","textarea","Certified quality you can trust."],
  ["home","export","title","Export Markets Heading","text","TRUSTED BY BUYERS IN 50+ COUNTRIES"],
  ["home","export","countries","Export Destinations Number","text","50+"],
  ["home","export","buyers","International Buyers Number","text","500+"],
  ["home","export","destinations_label","Export Destinations Label","text","Export Destinations"],
  ["home","export","buyers_label","International Buyers Label","text","International Buyers"],
  ["home","export","supply_value","Supply Capability Value","text","Bulk"],
  ["home","export","supply_label","Supply Capability Label","text","Supply Capability"],
  ["home","export","quality_value","Export Quality Value","text","100%"],
  ["home","export","quality_label","Export Quality Label","text","Export Quality Focused"],
  ["products","hero","eyebrow","Products Eyebrow","text","PRODUCTS"],
  ["products","hero","title","Products Page Heading","textarea","Himalayan Pink Salt Product Collection"],
  ["products","hero","description","Products Page Description","textarea","Export-ready Himalayan Pink Salt products available in retail packaging, grinder bottles, stand-up pouches, bulk supply and private label solutions."],
  ["products","retail","title","Retail Packaging Heading","text","RETAIL PACKAGING"],
  ["products","grinder","title","Grinder Collection Heading","text","GRINDER COLLECTION"],
  ["products","bulk","title","Bulk Packaging Heading","text","BULK SALT PACKAGING"],
  ["products","private_label","title","Private Label Solutions Heading","text","PRIVATE LABEL SOLUTIONS"],
  ["products","comparison","title","Product Comparison Heading","text","PRODUCT COMPARISON"],
  ["about","hero","eyebrow","About Eyebrow","text","ABOUT US"],
  ["about","hero","title","About Main Heading","textarea","Purity From The Himalayas, Trust From The World."],
  ["private-label","hero","eyebrow","Private Label Eyebrow","text","PRIVATE LABEL MANUFACTURER"],
  ["private-label","hero","title","Private Label Main Heading","textarea","Launch Your Own Himalayan Pink Salt Brand"],
  ["certifications","hero","eyebrow","Certifications Eyebrow","text","QUALITY & COMPLIANCE"],
  ["certifications","hero","title","Certifications Main Heading","textarea","Certified Quality You Can Trust"],
  ["contact","hero","eyebrow","Contact Eyebrow","text","CONTACT"],
  ["contact","hero","title","Contact Main Heading","textarea","Let’s Discuss Your Requirements"],
  ["global","footer","description","Footer Description","textarea","Premium Himalayan Pink Salt supplier offering retail packaging, bulk supply and private label solutions for distributors, wholesalers and international buyers worldwide."],
].map((row, index) => {
  const [page_slug, section_slug, field_key, field_label, field_type, default_value] = row as [string,string,string,string,"text"|"textarea",string];
  return { page_slug, section_slug, field_key, field_label, field_type, default_value, display_order: index + 1 };
});
