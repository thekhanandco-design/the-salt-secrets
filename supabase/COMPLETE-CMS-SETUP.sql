-- The Salt Origin CMS schema upgrade
-- Run this in Supabase SQL Editor before using all CMS modules.

alter table inquiries
add column if not exists status text default 'new',
add column if not exists notes text;

alter table products
add column if not exists status text default 'active';

create table if not exists categories (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default now(),
  name text not null,
  slug text unique not null,
  description text,
  status text default 'active'
);

create table if not exists seo_settings (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default now(),
  page_slug text unique not null,
  meta_title text,
  meta_description text,
  og_image text
);

create table if not exists site_settings (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default now(),
  site_name text default 'The Salt Origin',
  contact_email text default 'thekhanandco@gmail.com',
  whatsapp_number text default '92331281289',
  address text default 'Pakistan',
  footer_text text
);

insert into site_settings (site_name, contact_email, whatsapp_number, address, footer_text)
select 'The Salt Origin', 'thekhanandco@gmail.com', '92331281289', 'Pakistan', 'Premium Himalayan Pink Salt supplier offering retail packaging, bulk supply and private label solutions.'
where not exists (select 1 from site_settings);

insert into seo_settings (page_slug, meta_title, meta_description)
values
  ('home', 'The Salt Origin | Premium Himalayan Pink Salt Exporter', 'Premium Himalayan Pink Salt supplier offering retail packaging, bulk supply and private label solutions.'),
  ('products', 'Himalayan Pink Salt Products | The Salt Origin', 'Explore retail packaging, grinder bottles, stand-up pouches and bulk salt supply.'),
  ('contact', 'Contact The Salt Origin', 'Request quotation for Himalayan Pink Salt packaging, private label and bulk supply.')
on conflict (page_slug) do nothing;

-- Full CMS expansion
create table if not exists page_content (
  id bigint generated always as identity primary key,
  page_slug text unique not null,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default now()
);

create table if not exists media_library (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default now(),
  file_name text not null,
  file_url text not null,
  file_type text,
  alt_text text,
  folder text default 'general',
  file_size bigint
);

create table if not exists blog_posts (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  published_at timestamp with time zone,
  title text not null,
  slug text unique not null,
  excerpt text,
  content text,
  featured_image text,
  status text default 'draft',
  seo_title text,
  seo_description text
);

create table if not exists blog_categories (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default now(),
  name text not null,
  slug text unique not null
);

create table if not exists activity_logs (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default now(),
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb default '{}'::jsonb
);

alter table products
add column if not exists subtitle text,
add column if not exists gallery jsonb default '[]'::jsonb,
add column if not exists grain_type text,
add column if not exists sizes text,
add column if not exists packaging_type text,
add column if not exists best_for text,
add column if not exists specifications jsonb default '{}'::jsonb,
add column if not exists display_order integer default 0,
add column if not exists featured boolean default false,
add column if not exists seo_title text,
add column if not exists seo_description text;

insert into page_content (page_slug, content)
values
('home', '{"hero_title":"Himalayan Pink Salt Solutions For Global Markets","hero_description":"We provide premium quality Himalayan Pink Salt in multiple forms and packaging, trusted by importers, distributors and brands worldwide.","hero_image":"/hero-products.png"}'::jsonb),
('about', '{"eyebrow":"ABOUT US","hero_title":"Purity From The Himalayas, Trust From The World."}'::jsonb),
('products', '{"eyebrow":"PRODUCTS","hero_title":"Himalayan Pink Salt Product Collection"}'::jsonb),
('private-label', '{"eyebrow":"PRIVATE LABEL MANUFACTURER","hero_title":"Launch Your Own Himalayan Pink Salt Brand"}'::jsonb),
('certifications', '{"eyebrow":"QUALITY & COMPLIANCE","hero_title":"Certified Quality You Can Trust"}'::jsonb),
('contact', '{"eyebrow":"CONTACT","hero_title":"Let’s Discuss Your Requirements"}'::jsonb),
('footer', '{"description":"Premium Himalayan Pink Salt supplier offering retail packaging, bulk supply and private label solutions for distributors, wholesalers and international buyers worldwide."}'::jsonb),
('navbar', '{"cta_text":"Get Quote"}'::jsonb)
on conflict (page_slug) do nothing;
-- THE SALT ORIGIN ENTERPRISE CMS V2
-- Run after cms-schema.sql. Safe to run more than once.

create extension if not exists pgcrypto;

create table if not exists cms_languages (
  code text primary key,
  name text not null,
  native_name text not null,
  direction text not null default 'ltr' check (direction in ('ltr','rtl')),
  enabled boolean not null default true,
  is_default boolean not null default false,
  display_order integer not null default 0
);

insert into cms_languages(code,name,native_name,direction,enabled,is_default,display_order) values
('en','English','English','ltr',true,true,1),
('ar','Arabic','العربية','rtl',true,false,2),
('fr','French','Français','ltr',true,false,3),
('es','Spanish','Español','ltr',true,false,4),
('de','German','Deutsch','ltr',true,false,5),
('pt','Portuguese','Português','ltr',true,false,6),
('tr','Turkish','Türkçe','ltr',true,false,7),
('ur','Urdu','اردو','rtl',true,false,8)
on conflict (code) do update set name=excluded.name, native_name=excluded.native_name, direction=excluded.direction;

create table if not exists cms_text_entries (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null,
  section_slug text not null,
  field_key text not null,
  field_label text not null,
  field_type text not null default 'text',
  default_value text,
  display_order integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(page_slug, section_slug, field_key)
);

create table if not exists cms_text_translations (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references cms_text_entries(id) on delete cascade,
  language_code text not null references cms_languages(code) on delete cascade,
  value text,
  updated_at timestamptz not null default now(),
  unique(entry_id, language_code)
);

create table if not exists cms_image_slots (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null,
  section_slug text not null,
  slot_key text not null,
  title text not null,
  current_url text,
  default_url text,
  alt_text text,
  recommended_width integer,
  recommended_height integer,
  file_type text default 'image',
  display_order integer not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique(page_slug, section_slug, slot_key)
);

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  display_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists product_translations (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references products(id) on delete cascade,
  language_code text not null references cms_languages(code) on delete cascade,
  title text,
  subtitle text,
  description text,
  features jsonb not null default '[]'::jsonb,
  applications jsonb not null default '[]'::jsonb,
  seo_title text,
  seo_description text,
  unique(product_id, language_code)
);

alter table products add column if not exists features jsonb not null default '[]'::jsonb;
alter table products add column if not exists applications jsonb not null default '[]'::jsonb;
alter table products add column if not exists faq jsonb not null default '[]'::jsonb;
alter table products add column if not exists brochure_url text;
alter table products add column if not exists short_description text;
alter table products add column if not exists updated_at timestamptz default now();

create table if not exists cms_menus (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  location text not null unique,
  updated_at timestamptz default now()
);

create table if not exists cms_menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references cms_menus(id) on delete cascade,
  parent_id uuid references cms_menu_items(id) on delete cascade,
  label text not null,
  url text not null,
  language_code text not null default 'en' references cms_languages(code),
  display_order integer not null default 0,
  is_active boolean not null default true
);

insert into cms_menus(name,location) values ('Main Navigation','header'),('Footer Navigation','footer') on conflict do nothing;

-- Seed editable text registry
insert into cms_text_entries(page_slug,section_slug,field_key,field_label,field_type,default_value,display_order) values
('global','navbar','home','Home label','text','Home',1),
('global','navbar','about','About Us label','text','About Us',2),
('global','navbar','products','Products label','text','Products',3),
('global','navbar','private_label','Private Label label','text','Private Label',4),
('global','navbar','certifications','Certifications label','text','Certifications',5),
('global','navbar','blog','Blog label','text','Blog',6),
('global','navbar','contact','Contact label','text','Contact',7),
('global','navbar','quote','Get Quote button','text','Get Quote',8),
('home','hero','badge','Hero badge','text','PREMIUM QUALITY',1),
('home','hero','title','Hero main heading','textarea','Himalayan Pink Salt Solutions For Global Markets',2),
('home','hero','description','Hero description','textarea','We provide premium quality Himalayan Pink Salt in multiple forms and packaging, trusted by importers, distributors and brands worldwide.',3),
('home','hero','primary_button','Primary button','text','Explore Products',4),
('home','hero','secondary_button','Secondary button','text','Request Quote',5),
('home','private_label','title','Private label heading','text','PRIVATE LABEL SOLUTIONS',1),
('home','private_label','description','Private label description','textarea','We help brands create their identity with fully customized bottles and packaging.',2),
('home','products','title','Products section heading','text','OUR PRODUCT RANGE',1),
('home','why_choose','title','Why choose heading','text','WHY CHOOSE US',1),
('home','quality','title','Quality section heading','text','OUR QUALITY STANDARDS',1),
('home','export','title','Export section heading','text','TRUSTED BY BUYERS IN 50+ COUNTRIES',1),
('about','hero','eyebrow','About eyebrow','text','ABOUT US',1),
('about','hero','title','About heading','textarea','Purity From The Himalayas, Trust From The World.',2),
('products','hero','eyebrow','Products eyebrow','text','PRODUCTS',1),
('products','hero','title','Products heading','textarea','Himalayan Pink Salt Product Collection',2),
('products','hero','description','Products description','textarea','Export-ready Himalayan Pink Salt products available in retail packaging, grinder bottles, stand-up pouches, bulk supply and private label solutions.',3),
('private-label','hero','eyebrow','Private label eyebrow','text','PRIVATE LABEL MANUFACTURER',1),
('private-label','hero','title','Private label heading','textarea','Launch Your Own Himalayan Pink Salt Brand',2),
('certifications','hero','eyebrow','Certifications eyebrow','text','QUALITY & COMPLIANCE',1),
('certifications','hero','title','Certifications heading','textarea','Certified Quality You Can Trust',2),
('contact','hero','eyebrow','Contact eyebrow','text','CONTACT',1),
('contact','hero','title','Contact heading','textarea','Let’s Discuss Your Requirements',2),
('global','footer','description','Footer description','textarea','Premium Himalayan Pink Salt supplier offering retail packaging, bulk supply and private label solutions for distributors, wholesalers and international buyers worldwide.',1)
on conflict(page_slug,section_slug,field_key) do update set field_label=excluded.field_label, default_value=excluded.default_value;

-- Seed English translations from defaults
insert into cms_text_translations(entry_id, language_code, value)
select id,'en',default_value from cms_text_entries
on conflict(entry_id,language_code) do nothing;

-- Seed image registry
insert into cms_image_slots(page_slug,section_slug,slot_key,title,current_url,default_url,alt_text,recommended_width,recommended_height,display_order) values
('global','branding','logo','Site Logo — Header & Footer','/logo.png','/logo.png','The Salt Origin logo',400,220,1),
('home','hero','products','Homepage Hero Products','/hero-products.png','/hero-products.png','Himalayan Pink Salt products',900,900,1),
('home','hero','mountains','Homepage Mountain Background','/mountains-bg.png','/mountains-bg.png','Himalayan mountain background',1920,900,2),
('home','private-label','custom_labels','Custom Bottles Image','/custom-labels.png','/custom-labels.png','Custom bottle labels',600,400,1),
('home','private-label','custom_packaging','Custom Packaging Image','/custom-packaging.png','/custom-packaging.png','Custom packaging',600,400,2),
('home','products','pet_bottles','PET Bottles Image','/pet-bottles.png','/pet-bottles.png','PET bottles',600,600,1),
('home','products','pet_jars','PET Jars Image','/pet-jars.png','/pet-jars.png','PET jars',600,600,2),
('home','products','grinders','Grinder Collection Image','/grinder-bottles.png','/grinder-bottles.png','Salt grinders',600,600,3),
('home','products','pouches','Stand-Up Pouch Image','/standup-pouch.png','/standup-pouch.png','Stand-up pouch',600,600,4),
('home','quality','iso','ISO Certificate','/cert-iso.png','/cert-iso.png','ISO certification',400,400,1),
('home','quality','haccp','HACCP Certificate','/cert-haccp.png','/cert-haccp.png','HACCP certification',400,400,2),
('home','quality','gmp','GMP Certificate','/cert-gmp.png','/cert-gmp.png','GMP certification',400,400,3),
('home','quality','halal','Halal Certificate','/cert-halal.png','/cert-halal.png','Halal certification',400,400,4),
('home','quality','fda','FDA Certificate','/cert-fda.png','/cert-fda.png','FDA registration',400,400,5),
('home','quality','food','Food Certificate','/cert-food.png','/cert-food.png','Food safety certification',400,400,6),
('home','export','world_map','World Export Map','/world-map.png','/world-map.png','Global export markets map',1400,700,1),
('products','retail','retail_packaging','Retail Packaging Image','/retail-packaging.png','/retail-packaging.png','Retail salt packaging',900,700,1),
('products','grinders','grinder_bottles','Grinder Bottles Image','/grinder-bottles.png','/grinder-bottles.png','Grinder bottles',900,700,1),
('products','pouches','pouches','Pouches Image','/pouches.png','/pouches.png','Salt pouches',900,700,1),
('products','bulk','white_sack','Bulk White Sack','/white-sack.png','/white-sack.png','Bulk salt sack',500,500,1),
('private-label','hero','hero','Private Label Hero','/product-collage.png','/product-collage.png','Private label products',1000,800,1),
('certifications','hero','hero','Certifications Hero','/hero-banner.png','/hero-banner.png','Quality certifications',1400,700,1),
('contact','hero','hero','Contact Page Hero','/hero-banner.png','/hero-banner.png','Contact The Salt Origin',1400,700,1)
on conflict(page_slug,section_slug,slot_key) do update set title=excluded.title, default_url=excluded.default_url;

-- Storage buckets
insert into storage.buckets(id,name,public) values
('site-media','site-media',true),
('product-images','product-images',true),
('blog-images','blog-images',true),
('certificates','certificates',true),
('catalogs','catalogs',true)
on conflict(id) do update set public=true;

-- Development-friendly policies. Replace with authenticated role policies before public launch.
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and policyname='Public read CMS media') then
    create policy "Public read CMS media" on storage.objects for select using (bucket_id in ('site-media','product-images','blog-images','certificates','catalogs'));
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and policyname='Authenticated upload CMS media') then
    create policy "Authenticated upload CMS media" on storage.objects for insert to authenticated with check (bucket_id in ('site-media','product-images','blog-images','certificates','catalogs'));
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and policyname='Authenticated update CMS media') then
    create policy "Authenticated update CMS media" on storage.objects for update to authenticated using (bucket_id in ('site-media','product-images','blog-images','certificates','catalogs'));
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and policyname='Authenticated delete CMS media') then
    create policy "Authenticated delete CMS media" on storage.objects for delete to authenticated using (bucket_id in ('site-media','product-images','blog-images','certificates','catalogs'));
  end if;
end $$;

create index if not exists idx_cms_text_entries_page on cms_text_entries(page_slug,section_slug,display_order);
create index if not exists idx_cms_images_page on cms_image_slots(page_slug,section_slug,display_order);
create index if not exists idx_product_images_product on product_images(product_id,display_order);

-- Final CMS upgrade: editable category visuals and starter content
alter table categories add column if not exists image text;
alter table categories add column if not exists subtitle text;
alter table categories add column if not exists display_order integer default 0;
alter table categories add column if not exists updated_at timestamptz default now();

insert into categories(name,slug,description,status,image,subtitle,display_order) values
('Retail Packaging','retail-packaging','PET bottles, PET jars and retail-ready salt packaging.','active','/retail-packaging.png','Salt shaker and PET jar collection',1),
('Grinder Collection','grinder-collection','Plastic and ceramic grinder bottles for premium retail.','active','/grinder-bottles.png','Premium plastic and ceramic grinders',2),
('Stand-Up Pouches','stand-up-pouches','Zip-lock pouches for retail and e-commerce.','active','/pouches.png','Flexible retail pouch packaging',3),
('Bulk Salt Packaging','bulk-salt-packaging','Bulk fine and coarse grain salt for industrial buyers.','active','/white-sack.png','5kg to 50kg export bags',4),
('Private Label','private-label','Custom branded salt products and packaging.','active','/product-collage.png','Build your own salt brand',5)
on conflict(slug) do update set image=excluded.image,subtitle=excluded.subtitle,description=excluded.description,display_order=excluded.display_order;

insert into products(title,slug,subtitle,category,description,short_description,image,moq,packaging,status,grain_type,sizes,packaging_type,best_for,features,applications,specifications,gallery,featured,display_order,seo_title,seo_description)
values
('Salt Shaker','salt-shaker','PET Bottle','Retail Packaging','Premium food-grade Himalayan Pink Salt in convenient shaker packaging for retail shelves and household use.','Fine grain pink salt in PET shaker bottles.','/retail-packaging.png','1,200 units','PET bottle shaker','active','Fine Grain','100g, 200g, 250g','PET Bottle Shaker','Daily use, supermarkets, retail','["Food grade","Private label available","Multiple cap options"]'::jsonb,'["Retail","Household use","Supermarkets"]'::jsonb,'{"Origin":"Pakistan","Color":"Natural Pink","Shelf Life":"24 months"}'::jsonb,'["/retail-packaging.png","/product-4.png"]'::jsonb,true,1,'Himalayan Pink Salt Shaker | The Salt Origin','Private label Himalayan Pink Salt shaker bottles for retailers and importers.'),
('Salt Jar','salt-jar','PET Jar','Retail Packaging','Himalayan Pink Salt packed in clear PET jars with flexible sizes and custom labeling.','Retail-ready fine grain salt jars.','/pet-jars.png','800 units','PET jar','active','Fine Grain','500g, 750g, 1kg, 2kg','PET Jar','Kitchen use, retail','["Clear food-grade jar","Custom labels","Tamper seal options"]'::jsonb,'["Kitchen use","Retail","Private label"]'::jsonb,'{"Origin":"Pakistan","Material":"Food-grade PET","Salt Type":"Fine Grain"}'::jsonb,'["/pet-jars.png","/product-2.png"]'::jsonb,true,2,'Himalayan Pink Salt PET Jar','Pink salt PET jars in multiple sizes for private label and wholesale.'),
('Plastic Grinder Bottle','plastic-grinder-bottle','Plastic Grinder','Grinder Collection','Premium coarse Himalayan Pink Salt in durable plastic grinder bottles.','Coarse salt with plastic grinder mechanism.','/grinder-bottles.png','1,000 units','Plastic grinder bottle','active','Coarse Grain','100g, 200g, 225g, 360g, 500g','Plastic Grinder','Premium retail','["Adjustable grinder","Custom branding","Refill options"]'::jsonb,'["Gourmet retail","Restaurants","Gift packs"]'::jsonb,'{"Mechanism":"Plastic grinder","Salt Type":"Coarse","Origin":"Pakistan"}'::jsonb,'["/grinder-bottles.png","/product-3.png"]'::jsonb,true,3,'Plastic Himalayan Pink Salt Grinder','Private label plastic salt grinder bottles for global retail markets.'),
('Ceramic Grinder Bottle','ceramic-grinder-bottle','Ceramic Grinder','Grinder Collection','High-end ceramic grinder bottle filled with coarse Himalayan Pink Salt.','Premium ceramic grinding mechanism.','/ceramic-grinders.png','1,000 units','Ceramic grinder bottle','active','Coarse Grain','100g, 200g, 225g, 360g, 500g','Ceramic Grinder','Gourmet and premium retail','["Ceramic mechanism","Premium presentation","Private label ready"]'::jsonb,'["Gourmet stores","Hotels","Premium brands"]'::jsonb,'{"Mechanism":"Ceramic grinder","Salt Type":"Coarse","Origin":"Pakistan"}'::jsonb,'["/ceramic-grinders.png","/grinder-bottles1.png"]'::jsonb,false,4,'Ceramic Himalayan Pink Salt Grinder','Premium ceramic pink salt grinders for gourmet brands and importers.'),
('Stand-Up Pouch','stand-up-pouch','Zip-Lock Pouch','Stand-Up Pouches','Modern resealable stand-up pouch packaging for Himalayan Pink Salt.','Flexible zip-lock retail pouch.','/pouches.png','2,000 units','Stand-up pouch','active','Fine or Coarse','250g, 500g, 1kg','Zip-Lock Pouch','Retail and e-commerce','["Resealable zip lock","Custom printing","Lightweight shipping"]'::jsonb,'["E-commerce","Retail","Private label"]'::jsonb,'{"Material":"Food-grade laminated pouch","Closure":"Zip lock","Origin":"Pakistan"}'::jsonb,'["/pouches.png","/standup-pouch.png"]'::jsonb,true,5,'Himalayan Pink Salt Stand-Up Pouch','Custom printed stand-up pouches for Himalayan Pink Salt brands.')
on conflict(slug) do update set title=excluded.title,image=excluded.image,category=excluded.category,description=excluded.description,short_description=excluded.short_description,sizes=excluded.sizes,features=excluded.features,applications=excluded.applications,specifications=excluded.specifications,gallery=excluded.gallery;

-- Additional visual slots so every page has directly replaceable live images
insert into cms_image_slots(page_slug,section_slug,slot_key,title,current_url,default_url,alt_text,recommended_width,recommended_height,display_order) values
('about','hero','hero_image','About Page — Hero Image','/hero-banner.png','/hero-banner.png','About The Salt Origin',1400,700,1),
('about','story','company_image','About Page — Company Story Image','/product-collage.png','/product-collage.png','Himalayan Pink Salt company',900,700,2),
('products','hero','hero_image','Products Page — Hero Image','/hero-products.png','/hero-products.png','Himalayan Pink Salt products',1200,700,1),
('products','private-label','cta_image','Products Page — Private Label CTA','/product-collage.png','/product-collage.png','Private label salt packaging',900,600,1),
('private-label','gallery','labels','Private Label — Custom Labels','/custom-labels.png','/custom-labels.png','Custom salt labels',700,500,2),
('private-label','gallery','packaging','Private Label — Custom Packaging','/custom-packaging.png','/custom-packaging.png','Custom salt packaging',700,500,3),
('certifications','certificates','main','Certifications — Main Image','/cert-iso.png','/cert-iso.png','Quality certification',600,600,2),
('contact','office','contact_image','Contact Page — Contact Image','/hero-products.png','/hero-products.png','Contact The Salt Origin',900,700,2),
('blog','hero','hero_image','Blog Page — Hero Image','/og-image.jpg','/og-image.jpg','The Salt Origin Blog',1400,700,1)
on conflict(page_slug,section_slug,slot_key) do update set title=excluded.title,default_url=excluded.default_url;

create table if not exists blog_automation_settings (
  id bigint generated always as identity primary key,
  enabled boolean not null default false,
  frequency text not null default 'daily',
  approval_required boolean not null default true,
  default_language text not null default 'en',
  topic_focus text default 'Himalayan pink salt sourcing, private label packaging, retail trends, food industry applications and export guidance',
  updated_at timestamptz default now()
);
insert into blog_automation_settings(enabled,frequency,approval_required)
select false,'daily',true where not exists(select 1 from blog_automation_settings);
