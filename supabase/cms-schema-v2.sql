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
